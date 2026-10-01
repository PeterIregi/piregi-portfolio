import { db } from "@/lib/db";
import { siteSettings, projects, experiences, skills, testimonials, cvFiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
  return db.select().from(testimonials).orderBy(testimonials.sortOrder);
}

export async function getActiveCv() {
  const [cv] = await db
    .select()
    .from(cvFiles)
    .where(eq(cvFiles.isActive, true))
    .limit(1);
  return cv;
}