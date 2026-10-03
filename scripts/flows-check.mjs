/**
 * End-to-end check of the storage wiring: drives the real HTTP routes on a
 * running dev server with a real admin session, then verifies the bucket
 * contents and the cv_files counters in the database.
 *
 * Usage: BASE=http://localhost:3111 node scripts/flows-check.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = process.env.BASE ?? "http://localhost:3111";
const EMAIL = "admin@piregi.dev";
const PASSWORD = "changeme123";

const PDF = "%PDF-1.4\n% piregi flow check\n%%EOF\n";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const jar = new Map();
let failures = 0;

const ok = (cond, label, extra = "") => {
  console.log(`${cond ? "PASS" : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
  if (!cond) failures += 1;
};

function storeCookies(res) {
  for (const raw of res.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const idx = pair.indexOf("=");
    jar.set(pair.slice(0, idx), pair.slice(idx + 1));
  }
}
const cookieHeader = () =>
  [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

async function req(path, init = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: "manual",
    headers: { ...(jar.size ? { cookie: cookieHeader() } : {}), ...(init.headers ?? {}) },
  });
  storeCookies(res);
  return res;
}

const bucketKeys = async (bucket, folder) => {
  const { data, error } = await supabase.storage.from(bucket).list(folder, { limit: 1000 });
  if (error) throw new Error(error.message);
  return data.map((o) => `${folder}/${o.name}`);
};

const cvRow = async (id) => {
  const { data } = await supabase.from("cv_files").select("*").eq("id", id).maybeSingle();
  return data;
};

async function login() {
  const csrf = await (await req("/api/auth/csrf")).json();
  const body = new URLSearchParams({
    csrfToken: csrf.csrfToken,
    email: EMAIL,
    password: PASSWORD,
  });
  // The cookie jar is the assertion: Auth.js sets the session cookie on the
  // redirect response.
  await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  return [...jar.keys()].some((k) => k.includes("session-token"));
}

async function main() {
  console.log(`base ${BASE}\n`);

  // ---- auth boundary ----------------------------------------------------
  ok(await login(), "admin login issues a session cookie");

  const anonUpload = await fetch(`${BASE}/api/admin/media`, { method: "POST", body: new FormData() });
  ok(anonUpload.status >= 400, `unauthenticated media upload refused (${anonUpload.status})`);
  const anonDownload = await fetch(`${BASE}/api/cv/download/00000000-0000-0000-0000-000000000000`);
  ok(anonDownload.status === 404, `unknown cv id 404s for anonymous caller (${anonDownload.status})`);

  // ---- media ------------------------------------------------------------
  const pngRes = await req("/api/admin/media", {
    method: "POST",
    body: (() => {
      const fd = new FormData();
      fd.append("file", new File([PNG], "flow check.png", { type: "image/png" }));
      fd.append("altText", "A single transparent pixel");
      return fd;
    })(),
  });
  const asset = await pngRes.json();
  ok(pngRes.status === 201, `media upload accepted (${pngRes.status})`);
  ok(asset.altText === "A single transparent pixel", "alt text persisted", asset.altText);
  ok(asset.storagePath?.startsWith("media/"), "stored under media/", asset.storagePath);
  ok(
    (await bucketKeys("cv-images", "media")).includes(asset.storagePath),
    "object exists in cv-images"
  );

  const fetchedImage = await fetch(asset.publicUrl);
  const fetchedBytes = Buffer.from(await fetchedImage.arrayBuffer());
  ok(
    fetchedImage.ok && fetchedBytes.equals(PNG),
    `public url serves the image anonymously (${fetchedImage.status})`
  );

  const listRes = await req("/api/admin/media");
  const listed = await listRes.json();
  ok(
    Array.isArray(listed) && listed.some((i) => i.id === asset.id),
    "GET /api/admin/media lists the asset"
  );

  const badRes = await req("/api/admin/media", {
    method: "POST",
    body: (() => {
      const fd = new FormData();
      fd.append("file", new File(["not an image"], "notes.txt", { type: "text/plain" }));
      return fd;
    })(),
  });
  const badBody = await badRes.json();
  ok(badRes.status === 400 && /rejected/i.test(badBody.error), "text file rejected", badBody.error);

  const beforeDelete = (await bucketKeys("cv-images", "media")).length;
  const delRes = await req(`/api/admin/media/${asset.id}`, { method: "DELETE" });
  ok(delRes.status === 200, `media delete accepted (${delRes.status})`);
  ok(
    !(await bucketKeys("cv-images", "media")).includes(asset.storagePath),
    "object removed from cv-images"
  );
  ok((await bucketKeys("cv-images", "media")).length === beforeDelete - 1, "bucket shrank by one");
  ok((await req(`/api/admin/media/${asset.id}`, { method: "DELETE" })).status === 404, "second delete 404s");

  // ---- cv upload, versioning, download ---------------------------------
  const uploadCv = (name) =>
    req("/api/admin/cv/upload", {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        fd.append("file", new File([PDF], name, { type: "application/pdf" }));
        return fd;
      })(),
    });

  const badCv = await req("/api/admin/cv/upload", {
    method: "POST",
    body: (() => {
      const fd = new FormData();
      fd.append("file", new File([PNG], "sneaky.png", { type: "image/png" }));
      return fd;
    })(),
  });
  const badCvBody = await badCv.json();
  ok(badCv.status === 400 && /rejected/i.test(badCvBody.error), "png rejected as CV", badCvBody.error);

  const first = await (await uploadCv("flow-check-v1.pdf")).json();
  ok(first.isActive === true, "first upload becomes active");
  ok(first.downloadCount === 0, "starts at zero downloads");
  ok((await bucketKeys("cv-files", "cv")).includes(first.storagePath), "cv object exists in cv-files");

  const dl1 = await req(`/api/cv/download/${first.id}`);
  ok(dl1.status === 302, `download redirects (${dl1.status})`);
  const location = dl1.headers.get("location") ?? "";
  ok(/token=/.test(location), "redirect target is a signed url");
  const pdf1 = await fetch(location);
  ok(pdf1.ok && (await pdf1.text()) === PDF, `signed url serves the pdf (${pdf1.status})`);
  ok((await cvRow(first.id)).download_count === 1, "count incremented to 1");

  const dl2 = await req(`/api/cv/download/${first.id}`);
  ok(dl2.status === 302 && (await cvRow(first.id)).download_count === 2, "count incremented to 2");

  const second = await (await uploadCv("flow-check-v2.pdf")).json();
  ok(second.isActive === true, "second upload becomes active");
  ok((await cvRow(first.id)).is_active === false, "first upload deactivated");
  const activeCount = (
    await supabase.from("cv_files").select("id").eq("is_active", true)
  ).data?.length;
  ok(activeCount === 1, `exactly one active row (${activeCount})`);

  const archived = await req(`/api/cv/download/${first.id}`);
  ok(archived.status === 404, `archived version is not downloadable (${archived.status})`);
  ok((await cvRow(first.id)).download_count === 2, "rejected download did not count");

  // ---- delete removes the object too ------------------------------------
  const delCv = await req(`/api/admin/cv/${first.id}/delete`, { method: "POST" });
  ok(delCv.status === 200, `cv delete accepted (${delCv.status})`);
  ok(!(await bucketKeys("cv-files", "cv")).includes(first.storagePath), "cv object removed from bucket");
  ok((await cvRow(first.id)) === null, "cv row gone");

  const delActive = await req(`/api/admin/cv/${second.id}/delete`, { method: "POST" });
  ok(delActive.status === 400, `active cv is protected (${delActive.status})`);
  ok((await cvRow(second.id)) !== null, "active row survives");

  await teardown();

  console.log(failures ? `\n${failures} FAILURE(S)` : "\nall flow checks passed");
  process.exit(failures ? 1 : 0);
}

/**
 * The last CV is deliberately left active (the API refuses to delete it), so
 * the leftovers are cleared through the service client instead: otherwise a
 * fake "flow-check-v2.pdf" stays active and the public /cv page would offer
 * it as a real CV.
 */
async function teardown() {
  const { data: leftoverCvs } = await supabase
    .from("cv_files")
    .select("id, storage_path")
    .like("original_filename", "flow-check%");
  for (const cv of leftoverCvs ?? []) {
    await supabase.storage.from("cv-files").remove([cv.storage_path]);
    await supabase.from("cv_files").delete().eq("id", cv.id);
  }
  console.log(`\nteardown: removed ${leftoverCvs?.length ?? 0} test cv row(s)`);

  const { data: leftoverMedia } = await supabase
    .from("media_assets")
    .select("id, storage_path")
    .like("storage_path", "%flow-check%");
  for (const asset of leftoverMedia ?? []) {
    await supabase.storage.from("cv-images").remove([asset.storage_path]);
    await supabase.from("media_assets").delete().eq("id", asset.id);
  }
  console.log(`teardown: removed ${leftoverMedia?.length ?? 0} test media row(s)`);
}

main().catch((e) => {
  console.error("flow check threw:", e);
  process.exit(1);
});
