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

export const MAX_IMAGE_DIMENSION_PX = 20000;

/**
 * Intrinsic size sent alongside the image file, read from the file in the
 * browser before upload (#90).
 *
 * The bounds are a sanity rail, not a security boundary, and deliberately so:
 * the upload route is already behind `requireAdmin()`, and these two numbers
 * only pick an aspect ratio for `next/image`, so a wrong value is a wrong
 * crop rather than any kind of access. Rejecting implausible values still
 * matters because a stray zero or a typo'd five-digit number would render a
 * page at an absurd ratio.
 *
 * Both values or neither: a ratio needs both, and one on its own has no
 * meaning. `coerce` turns the FormData strings into numbers and rejects
 * anything non-numeric, so a hand-rolled request cannot store `NaN`.
 */
export const imageDimensionsSchema = z.object({
  width: z.coerce
    .number()
    .int()
    .min(1, `Width must be between 1 and ${MAX_IMAGE_DIMENSION_PX}px`)
    .max(MAX_IMAGE_DIMENSION_PX, `Width must be between 1 and ${MAX_IMAGE_DIMENSION_PX}px`),
  height: z.coerce
    .number()
    .int()
    .min(1, `Height must be between 1 and ${MAX_IMAGE_DIMENSION_PX}px`)
    .max(MAX_IMAGE_DIMENSION_PX, `Height must be between 1 and ${MAX_IMAGE_DIMENSION_PX}px`),
});

export type ImageDimensions = z.infer<typeof imageDimensionsSchema>;
