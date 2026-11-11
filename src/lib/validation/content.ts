import { z } from "zod";

// Media ids come from the picker, which clears a selection to the empty string
// before the form turns it into null. Keep one definition so avatar, cover and
// gallery ids cannot drift.
const mediaIdSchema = z.string().uuid();

/**
 * Shared by the admin list and [id] routes (AGENTS.md: one Zod schema per
 * shape, defined once in src/lib/validation/).
 */
export const experienceSchema = z.object({
  roleTitle: z.string().min(1).max(200),
  organization: z.string().min(1).max(200),
  startDate: z.string().date(),
  endDate: z.string().date().optional().nullable(),
  description: z.string().min(1),
  type: z.enum(["work", "education", "certification"]),
  sortOrder: z.number().int().default(0),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

export const skillSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.string().min(1).max(100),
  proficiency: z.number().int().min(1).max(5).optional(),
});

export type SkillInput = z.infer<typeof skillSchema>;

export const testimonialSchema = z.object({
  authorName: z.string().min(1).max(100),
  authorTitle: z.string().min(1).max(100),
  company: z.string().max(100).optional(),
  quote: z.string().min(1),
  avatarMediaId: mediaIdSchema.nullable().optional(),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;

/**
 * Shared by the admin project create and [id] routes; the update route
 * reuses it wholesale because both accept the same editable shape
 * (AGENTS.md: one Zod schema per shape).
 */
export const projectSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  summary: z.string().min(1).max(500),
  description: z.string().min(1),
  coverMediaId: mediaIdSchema.nullable().optional(),
  galleryMediaIds: z
    .array(mediaIdSchema)
    .max(24)
    .refine((ids) => new Set(ids).size === ids.length, { message: "Gallery images must be unique" })
    .optional(),
  techStack: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  projectUrl: z.string().url().optional().or(z.literal("")),
  repoUrl: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type ProjectInput = z.infer<typeof projectSchema>;