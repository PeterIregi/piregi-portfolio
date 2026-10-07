import { z } from "zod";

/**
 * Shape of the alt-text update on an existing media asset. Shared by the
 * PATCH route and the media library form (AGENTS.md: one schema per shape).
 *
 * Alt text lands in every rendered image's `alt` attribute, so it is
 * length-capped. Empty trims to null by design: an asset with no recorded
 * dimensions is the reason the media library flags "Missing alt text", and
 * clearing the field must be expressible.
 */
export const mediaAltTextSchema = z.object({
  altText: z.string().trim().max(200, "Alt text must be 200 characters or fewer"),
});

export type MediaAltTextInput = z.infer<typeof mediaAltTextSchema>;