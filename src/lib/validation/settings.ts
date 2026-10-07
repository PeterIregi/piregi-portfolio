import { z } from "zod";

/**
 * Shape of the site settings the admin edits (brand, meta, socials). Shared by
 * the PUT route and the settings form (AGENTS.md: one schema per shape).
 *
 * The public site renders these values into <meta property="og:image"> and
 * <a href> attributes, so URLs are validated and every value is length-capped
 * before it is written (#95).
 */

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be ${max} characters or fewer`);

const optionalUrl = z.union([
  z.literal(""),
  z.string().trim().url("Enter a valid URL").max(2048, "Must be 2048 characters or fewer"),
]);

const optionalEmail = z.union([
  z.literal(""),
  z.string().trim().email("Enter a valid email").max(200, "Must be 200 characters or fewer"),
]);

const bioSchema = z.object({
  photoMediaId: z.string().trim().uuid().nullable().or(z.literal("")),
});

export const settingsSchema = z.object({
  brand: z.object({
    name: optionalText(100),
    tagline: optionalText(200),
  }),
  meta: z.object({
    title: optionalText(200),
    description: optionalText(500),
    ogImage: optionalUrl,
  }),
  socials: z.object({
    github: optionalUrl,
    linkedin: optionalUrl,
    email: optionalEmail,
  }),
  bio: bioSchema.optional(),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
