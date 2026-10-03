import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

/**
 * The only place in the app that talks to Supabase Storage (design.md §5).
 *
 * Two buckets, and the difference between them is the security boundary:
 * `cv-images` is public because images are meant to be seen, while
 * `cv-files` is private because CV bytes may only leave through
 * `GET /api/cv/download`, the endpoint that increments the download count
 * (design.md §4). Nothing outside this folder may import the supabase
 * client.
 */

const CV_BUCKET = "cv-files";
const IMAGE_BUCKET = "cv-images";

/**
 * Signed URLs are handed to the browser by the download endpoint and then
 * immediately followed, so a short TTL limits how long a leaked URL stays
 * useful without risking an expiry mid-download.
 */
const SIGNED_URL_TTL_SECONDS = 60;

export type StorageBucket = typeof CV_BUCKET | typeof IMAGE_BUCKET;

let client: ReturnType<typeof createClient> | null = null;

/**
 * Built lazily and cached: constructing a client at import time would make
 * `next build` fail on any environment without storage credentials.
 */
function getClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Storage is not configured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required"
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/**
 * Bucket names are unique per upload so re-uploading a same-named file never
 * overwrites a previous version. The client-supplied name is reduced to a
 * single safe path segment: dots are not allowed in the base name, so a name
 * like "../../etc/passwd.pdf" can never leave a `..` segment to traverse with.
 */
function sanitizeFilename(name: string) {
  const lower = name.toLowerCase();
  const lastDot = lower.lastIndexOf(".");
  const base = lastDot > 0 ? lower.slice(0, lastDot) : lower;
  const extension = lastDot > 0 ? lower.slice(lastDot + 1) : "";

  const safeBase = base
    .replace(/[^\w-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safeExtension = extension.replace(/[^\w]+/g, "");

  if (!safeBase && !safeExtension) return "upload";
  return safeExtension ? `${safeBase || "upload"}.${safeExtension}` : safeBase;
}

function buildObjectPath(prefix: "cv" | "media", file: File) {
  return `${prefix}/${uuidv4()}-${sanitizeFilename(file.name)}`;
}

async function uploadToBucket(bucket: StorageBucket, path: string, file: File) {
  const { error } = await getClient()
    .storage.from(bucket)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Upload to ${bucket} failed: ${error.message}`);
  }
  return path;
}

/** Store a validated PDF in the private CV bucket. Returns its storage path. */
export async function uploadCv(file: File) {
  return uploadToBucket(CV_BUCKET, buildObjectPath("cv", file), file);
}

/**
 * Store a validated image in the public image bucket. Returns the path to
 * persist in `media_assets.storage_path` plus the public URL to persist in
 * `media_assets.public_url`.
 */
export async function uploadImage(file: File) {
  const storagePath = await uploadToBucket(IMAGE_BUCKET, buildObjectPath("media", file), file);
  return { storagePath, publicUrl: getImagePublicUrl(storagePath) };
}

/** Public URL for a path already stored in the image bucket. */
export function getImagePublicUrl(storagePath: string) {
  const { data } = getClient().storage.from(IMAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Short-lived signed URL for a private CV object. The download endpoint is
 * the only caller: this is the single place CV bytes are handed out.
 */
export async function getCvSignedPath(storagePath: string) {
  const { data, error } = await getClient()
    .storage.from(CV_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    throw new Error(`Signing CV file failed: ${error.message}`);
  }
  return data.signedUrl;
}

/** Remove an object from a bucket. Missing objects are not an error. */
export async function deleteObject(storagePath: string, bucket: StorageBucket) {
  const { error } = await getClient().storage.from(bucket).remove([storagePath]);
  if (error) {
    throw new Error(`Delete from ${bucket} failed: ${error.message}`);
  }
}
