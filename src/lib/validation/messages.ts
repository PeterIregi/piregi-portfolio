import { z } from "zod";

/**
 * Shared by the contact form and the /api/contact route
 * (AGENTS.md: one Zod schema per shape, defined once).
 */
export const contactSubmissionSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
  // Honeypot: only ever a non-empty string when a bot fills the hidden field.
  hp: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSubmissionSchema>;