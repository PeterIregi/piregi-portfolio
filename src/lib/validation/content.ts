import { z } from "zod";

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
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;