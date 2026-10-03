import { db } from "@/lib/db";
import {
  siteSettings,
  projects,
  projectGallery,
  mediaAssets,
  experiences,
  skills,
  testimonials,
} from "@/lib/db/schema";
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
    bio?: { photoMediaId?: string };
  };
}

export async function getBioPhoto() {
  const [row] = await db
    .select({
      photoMediaId: siteSettings.value,
    })
    .from(siteSettings)
    .where(eq(siteSettings.key, "bio"))
    .limit(1);

  if (!row?.photoMediaId || typeof row.photoMediaId !== "object" || !("photoMediaId" in row.photoMediaId)) {
    return null;
  }

  const mediaId = (row.photoMediaId as { photoMediaId: string }).photoMediaId;
  if (!mediaId) return null;

  const [asset] = await db
    .select({ publicUrl: mediaAssets.publicUrl, altText: mediaAssets.altText })
    .from(mediaAssets)
    .where(eq(mediaAssets.id, mediaId))
    .limit(1);

  return asset ?? null;
}

export async function listPublishedProjects() {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      techStack: projects.techStack,
      tags: projects.tags,
      updatedAt: projects.updatedAt,
      // A left join, so a project whose cover was never picked in the admin
      // still lists instead of dropping out of the grid.
      coverUrl: mediaAssets.publicUrl,
      coverAltText: mediaAssets.altText,
    })
    .from(projects)
    .leftJoin(mediaAssets, eq(projects.coverMediaId, mediaAssets.id))
    .where(eq(projects.status, "published"))
    .orderBy(projects.createdAt);
}

export async function getPublishedProjectBySlug(slug: string) {
  const [project] = await db
    .select({
      id: projects.id,
      title: projects.title,
      slug: projects.slug,
      summary: projects.summary,
      description: projects.description,
      techStack: projects.techStack,
      tags: projects.tags,
      projectUrl: projects.projectUrl,
      repoUrl: projects.repoUrl,
      updatedAt: projects.updatedAt,
      coverUrl: mediaAssets.publicUrl,
      coverAltText: mediaAssets.altText,
    })
    .from(projects)
    .leftJoin(mediaAssets, eq(projects.coverMediaId, mediaAssets.id))
    .where(and(eq(projects.slug, slug), eq(projects.status, "published")))
    .limit(1);
  return project ?? null;
}

/**
 * Gallery plates in the order the admin arranged them. Joined from
 * media_assets rather than returning ids so the page never has to reach
 * into mediaAssets itself (design.md §3).
 */
export async function listPublishedProjectGallery(projectId: string) {
  return db
    .select({
      id: mediaAssets.id,
      publicUrl: mediaAssets.publicUrl,
      altText: mediaAssets.altText,
      position: projectGallery.position,
    })
    .from(projectGallery)
    .innerJoin(mediaAssets, eq(projectGallery.mediaId, mediaAssets.id))
    .where(eq(projectGallery.projectId, projectId))
    .orderBy(projectGallery.position);
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
