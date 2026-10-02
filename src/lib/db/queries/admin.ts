import { db } from "@/lib/db";
import { projects, experiences, skills, testimonials, cvFiles, contactSubmissions, pageViews, mediaAssets, siteSettings } from "@/lib/db/schema";
import { eq, desc, count, sql } from "drizzle-orm";

export async function getDashboardStats() {
  const [projectsCount, messagesCount, cvDownloads, visits] = await Promise.all([
    db.select({ count: count() }).from(projects).where(eq(projects.status, "published")),
    db.select({ count: count() }).from(contactSubmissions).where(eq(contactSubmissions.status, "new")),
    db.select({ total: sql<number>`sum(${cvFiles.downloadCount})` }).from(cvFiles),
    db.select({ count: count() }).from(pageViews).where(sql`${pageViews.viewedAt} > NOW() - INTERVAL '30 days'`),
  ]);

  return {
    publishedProjects: projectsCount[0]?.count ?? 0,
    newMessages: messagesCount[0]?.count ?? 0,
    totalCvDownloads: cvDownloads[0]?.total ?? 0,
    visitsLast30Days: visits[0]?.count ?? 0,
  };
}

export async function listRecentMessages(limit = 5) {
  return db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.submittedAt))
    .limit(limit);
}

export async function listAllProjects() {
  return db
    .select()
    .from(projects)
    .orderBy(desc(projects.createdAt));
}

export async function listAllExperiences() {
  return db.select().from(experiences).orderBy(experiences.sortOrder);
}

export async function listAllSkills() {
  return db.select().from(skills);
}

export async function listAllTestimonials() {
  return db.select().from(testimonials).orderBy(testimonials.sortOrder);
}

export async function listAllMediaAssets() {
  return db.select().from(mediaAssets).orderBy(desc(mediaAssets.uploadedAt));
}

export async function getAllMessages() {
  return db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.submittedAt));
}

export async function getSiteSettingsAll() {
  const rows = await db.select().from(siteSettings);
  const settings: Record<string, unknown> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}