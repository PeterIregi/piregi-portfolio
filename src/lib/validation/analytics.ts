import { z } from "zod";

/**
 * Shape of the page-view beacon body. The endpoint consumes arbitrary
 * POSTs from the public internet (#101), so the path is bounded and
 * constrained before it is written to page_views: any string would otherwise
 * be free to land in the admin overview table untouched.
 */
export const pageViewSchema = z.object({
  path: z
    .string()
    .max(500, "Path must be 500 characters or fewer")
    .refine((p) => p.startsWith("/"), "Path must start with /")
    .refine((p) => !/[\x00-\x1f\x7f]/.test(p), "Path must not contain control characters"),
});

export type PageViewInput = z.infer<typeof pageViewSchema>;