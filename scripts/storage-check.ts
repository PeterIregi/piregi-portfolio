// Next.js loads .env.local for the app itself; a plain tsx script has to do
// it by hand.
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import {
  uploadCv,
  uploadImage,
  getCvSignedPath,
  deleteObject,
} from "@/lib/storage";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PDF_BYTES = "%PDF-1.4\n% piregi storage round-trip check\n%%EOF\n";
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function assert(ok: boolean, label: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  // Presence is checked through the bucket listing rather than by re-fetching
  // the URL: Supabase's CDN keeps serving a URL for as long as its cache
  // directive allows, so a 200 after delete says nothing about the object.
  const listed = async (bucket: "cv-files" | "cv-images") => {
    const { data, error } = await supabase.storage.from(bucket).list("", { limit: 1000 });
    if (error) throw new Error(`list ${bucket}: ${error.message}`);
    return data.map((o) => o.name);
  };
  const objects = async (bucket: "cv-files" | "cv-images", folder: string) => {
    const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
    if (error) throw new Error(`list ${bucket}/${folder}: ${error.message}`);
    return data.map((o) => `${folder}/${o.name}`);
  };

  // --- private CV bucket -------------------------------------------------
  const cvPath = await uploadCv(
    new File([PDF_BYTES], "piregi round-trip check.pdf", { type: "application/pdf" })
  );
  console.log(`      uploaded cv -> ${cvPath}`);
  assert(cvPath.startsWith("cv/") && cvPath.endsWith(".pdf"), "cv stored under cv/ with .pdf key");
  assert((await objects("cv-files", "cv")).includes(cvPath), "cv object is in the bucket");

  const signed = await getCvSignedPath(cvPath);
  console.log(`      signed url has token=${/token=/.test(signed)}`);
  assert(/token=/.test(signed), "signed url carries an access token");

  const fetched = await fetch(signed);
  const text = await fetched.text();
  assert(fetched.ok && text === PDF_BYTES, "signed url serves the exact bytes back");

  // A private bucket must reject an unsigned read of the same object.
  const unsigned = await fetch(
    `https://${process.env.SUPABASE_URL!.replace("https://", "")}/storage/v1/object/public/cv-files/${cvPath}`
  );
  assert(unsigned.status === 400 || unsigned.status === 404, `unsigned cv read blocked (${unsigned.status})`);

  await deleteObject(cvPath, "cv-files");
  assert(!(await objects("cv-files", "cv")).includes(cvPath), "deleted cv is gone from the bucket");

  // --- public image bucket ----------------------------------------------
  const { storagePath, publicUrl } = await uploadImage(
    new File([PNG_BYTES], "piregi round-trip check.png", { type: "image/png" })
  );
  console.log(`      uploaded image -> ${storagePath}`);
  console.log(`      public url -> ${publicUrl}`);
  assert(storagePath.startsWith("media/"), "image stored under media/");
  assert(/\/storage\/v1\/object\/public\/cv-images\//.test(publicUrl), "public url points at cv-images");

  const anon = await fetch(publicUrl);
  const bytes = Buffer.from(await anon.arrayBuffer());
  assert(anon.ok && bytes.equals(PNG_BYTES), "public url serves the image with no credentials");

  await deleteObject(storagePath, "cv-images");
  assert(!(await objects("cv-images", "media")).includes(storagePath), "deleted image is gone from the bucket");

  // --- filename sanitising ----------------------------------------------
  const nasty = await uploadCv(
    new File([PDF_BYTES], "../../etc/passwd  .pdf", { type: "application/pdf" })
  );
  console.log(`      sanitised -> ${nasty}`);
  assert(
    nasty.split("/").length === 2 && !nasty.includes("..") && nasty.endsWith(".pdf"),
    "traversal segments stripped from key"
  );
  await deleteObject(nasty, "cv-files");

  console.log(process.exitCode ? "\nFAILURES ABOVE" : "\nall storage checks passed");
}

main().catch((error) => {
  console.error("storage check threw:", error);
  process.exit(1);
});
