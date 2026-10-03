import { z } from "zod";

/**
 * Upload shapes for CV PDFs and media images. Shared by the upload route and
 * the admin form that triggers it (AGENTS.md: a shape is defined once), and
 * enforced server-side — the client-side checks are UX sugar only
 * (design.md §4).
 */

export const MAX_CV_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];

const fileShape = z.custom<File>(
  (value) => value instanceof File,
  { message: "No file provided" }
);

export const cvUploadSchema = fileShape
  .refine((file) => file.size > 0, "File is empty")
  .refine((file) => file.size <= MAX_CV_BYTES, "File must be 10MB or smaller")
  .refine((file) => file.type === "application/pdf", "File must be a PDF")
  .refine(
    (file) => file.name.toLowerCase().endsWith(".pdf"),
    "File must have a .pdf extension"
  );

export const imageUploadSchema = fileShape
  .refine((file) => file.size > 0, "File is empty")
  .refine((file) => file.size <= MAX_IMAGE_BYTES, "Image must be 5MB or smaller")
  .refine(
    (file) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type),
    `Image must be one of: ${ALLOWED_IMAGE_TYPES.join(", ")}`
  )
  .refine(
    (file) => IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
    `Image must have one of these extensions: ${IMAGE_EXTENSIONS.join(", ")}`
  );

/** First validation message, or null when the file is acceptable. */
export function validateCvFile(file: File | null): string | null {
  const result = cvUploadSchema.safeParse(file);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "File rejected";
}

/** First validation message, or null when the file is acceptable. */
export function validateImageFile(file: File | null): string | null {
  const result = imageUploadSchema.safeParse(file);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "File rejected";
}
