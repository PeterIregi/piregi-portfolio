import { db } from "@/lib/db";
import { siteSettings, projects, experiences, skills, testimonials, mediaAssets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveCv } from "@/lib/db/cv";

export async function getSiteSettings() {
  const rows = await db.select().from(siteSettings);
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings as {
    meta?: { title?: string; description?: string; ogImage?: string };
    socials?: { github?: string; linkedin?: string; email?: string };
    brand?: { name?: string; tagline?: string };
  };
}

export async function listPublishedProjects() {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      coverMediaId: projects.coverMediaId,
      techStack: projects.techStack,
      tags: projects.tags,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .where(eq(projects.status, "published"))
    .orderBy(projects.createdAt);
}

export async function getPublishedProjectBySlug(slug: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
    .limit(1);
  return project;
}

export async function listExperiences() {
  return db.select().from(experiences).orderBy(experiences.sortOrder);
}

export async function listSkills() {
  return db.select().from(skills);
}

export async function listTestimonials() {
  return db
    .select({
      id: testimonials.id,
      authorName: testimonials.authorName,
      authorTitle: testimonials.authorTitle,
      company: testimonials.company,
      quote: testimonials.quote,
      avatarMediaId: testimonials.avatarMediaId,
      avatarUrl: mediaAssets.publicUrl,
      avatarAltText: mediaAssets.altText,
      sortOrder: testimonials.sortOrder,
    })
    .from(testimonials)
    .leftJoin(mediaAssets, eq(testimonials.avatarMediaId, mediaAssets.id))
    .orderBy(testimonials.sortOrder);
}

export { getActiveCv };
