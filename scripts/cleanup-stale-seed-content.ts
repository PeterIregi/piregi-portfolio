// One-off cleanup for databases seeded before #9 replaced the sample content
// with the real resume details (#127).
//
// The seed inserts with `onConflictDoNothing` against fixed uuids, so on a
// database that already held the samples it can neither insert the replacement
// rows (their uuids are taken) nor remove the rows it no longer defines. The
// result is the fictional projects, roles, testimonial, skills, media and
// site_settings still being served. This deletes exactly those rows so
// `pnpm db:seed` can insert the real content into the freed uuids.
//
// Guards: every row is matched on its fixed uuid *and* the placeholder value it
// is expected to still hold. A row the owner has edited in place fails the
// value check and is skipped with a warning, never deleted. Dry-run by default.
//
//   pnpm tsx scripts/cleanup-stale-seed-content.ts            # report only
//   pnpm tsx scripts/cleanup-stale-seed-content.ts --apply    # delete
//
// The removed rows are written to .tmp/stale-seed-content-<timestamp>.json
// first, so the deletion can be reversed by hand if it was a mistake.
import { config } from "dotenv";
config({ path: ".env.local" });

import { mkdir, writeFile } from "node:fs/promises";
import { db, closeDb } from "@/lib/db";
import { projects, experiences, testimonials, skills, mediaAssets, siteSettings } from "@/lib/db/schema";
import { deleteObject } from "@/lib/storage";
import { eq, inArray } from "drizzle-orm";

type Removed = Record<string, unknown>;

const APPLY = process.argv.includes("--apply");

async function guard<T extends { id: string }>(
  rows: T[],
  ids: string[],
  holds: (row: T) => boolean,
  label: string
): Promise<T[]> {
  const keep: T[] = [];
  for (const id of ids) {
    const row = rows.find((r) => r.id === id);
    if (!row) continue;
    if (!holds(row)) {
      console.warn(`  ! ${label} ${id} no longer holds the placeholder value — skipping (edited?)`);
      continue;
    }
    keep.push(row);
  }
  return keep;
}

async function main() {
  const removed: { [table: string]: Removed[] } = {};

  // Order matters: testimonials and projects must go before their media, and
  // the projects' gallery rows cascade with them.
  const testimonialRows = await guard(
    await db.select().from(testimonials).where(inArray(testimonials.id, ["5f000000-0000-4000-8000-000000000001"])),
    ["5f000000-0000-4000-8000-000000000001"],
    (r) => r.authorName === "Jane Smith",
    "testimonial"
  );

  const experienceIds = [
    "3f000000-0000-4000-8000-000000000001",
    "3f000000-0000-4000-8000-000000000002",
    "3f000000-0000-4000-8000-000000000003",
  ];
  const experienceRows = await guard(
    await db.select().from(experiences).where(inArray(experiences.id, experienceIds)),
    experienceIds,
    // The seed's exact placeholders: two fictional roles and a fictional
    // degree. Anything else at these uuids is the owner's in-place edit.
    (r) =>
      (r.organization === "TechCorp Inc." && r.roleTitle === "Senior Full Stack Developer") ||
      (r.organization === "StartupXYZ" && r.roleTitle === "Full Stack Developer") ||
      (r.organization === "University of Technology" && r.roleTitle === "BSc Computer Science"),
    "experience"
  );

  const projectIds = ["2f000000-0000-4000-8000-000000000001", "2f000000-0000-4000-8000-000000000002"];
  const projectRows = await guard(
    await db.select().from(projects).where(inArray(projects.id, projectIds)),
    projectIds,
    (r) => r.slug === "ecommerce-platform" || r.slug === "task-management-app",
    "project"
  );

  const skillIds = [
    "4f000000-0000-4000-8000-000000000001",
    "4f000000-0000-4000-8000-000000000002",
    "4f000000-0000-4000-8000-000000000003",
    "4f000000-0000-4000-8000-000000000004",
    "4f000000-0000-4000-8000-000000000005",
    "4f000000-0000-4000-8000-000000000006",
  ];
  const skillRows = await guard(
    await db.select().from(skills).where(inArray(skills.id, skillIds)),
    skillIds,
    (r) => ["TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker"].includes(r.name),
    "skill"
  );

  const mediaIds = [
    "1f000000-0000-4000-8000-000000000001",
    "1f000000-0000-4000-8000-000000000002",
    "1f000000-0000-4000-8000-000000000003",
  ];
  const mediaRows = await guard(
    await db.select().from(mediaAssets).where(inArray(mediaAssets.id, mediaIds)),
    mediaIds,
    (r) => /ecommerce-platform-cover|task-manager-cover|jane-smith-avatar/.test(r.storagePath),
    "media"
  );

  const settingsRows = await db.select().from(siteSettings);
  const placeholderSettings = settingsRows.filter((row) => {
    const value = row.value as Record<string, unknown>;
    if (row.key === "meta") return value.title === "Peter Iregi — Full Stack Developer";
    if (row.key === "socials") return value.email === "peter@piregi.dev";
    if (row.key === "brand") return value.tagline === "Full Stack Developer";
    if (row.key === "bio") return value.photoMediaId === "1f000000-0000-4000-8000-000000000003";
    return false;
  });

  if (testimonialRows.length) removed.testimonials = testimonialRows;
  if (experienceRows.length) removed.experiences = experienceRows;
  if (projectRows.length) removed.projects = projectRows;
  if (skillRows.length) removed.skills = skillRows;
  if (mediaRows.length) removed.mediaAssets = mediaRows;
  if (placeholderSettings.length) removed.siteSettings = placeholderSettings;

  for (const [table, rows] of Object.entries(removed)) {
    console.log(`${table}: ${rows.length}`);
  }
  if (!Object.keys(removed).length) {
    console.log("Nothing to clean — this database never held the pre-#9 samples.");
    return;
  }

  await mkdir(".tmp", { recursive: true });
  const dumpPath = `.tmp/stale-seed-content-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  await writeFile(dumpPath, JSON.stringify(removed, null, 2));
  console.log(`\nRemoved rows written to ${dumpPath}`);

  if (!APPLY) {
    console.log("Dry run. Re-run with --apply to delete, then run `pnpm db:seed`.");
    return;
  }

  if (testimonialRows.length)
    await db.delete(testimonials).where(inArray(testimonials.id, testimonialRows.map((r) => r.id)));
  if (experienceRows.length)
    await db.delete(experiences).where(inArray(experiences.id, experienceRows.map((r) => r.id)));
  if (projectRows.length)
    await db.delete(projects).where(inArray(projects.id, projectRows.map((r) => r.id)));
  if (skillRows.length) await db.delete(skills).where(inArray(skills.id, skillRows.map((r) => r.id)));

  // Object before row, matching the media delete route: a row pointing at a
  // deleted object is a visible broken image (#99).
  for (const asset of mediaRows) await deleteObject(asset.storagePath, "cv-images");
  if (mediaRows.length)
    await db.delete(mediaAssets).where(inArray(mediaAssets.id, mediaRows.map((r) => r.id)));

  for (const row of placeholderSettings) await db.delete(siteSettings).where(eq(siteSettings.key, row.key));

  console.log("\nDeleted. Now run `pnpm db:seed` to insert the real content into the freed uuids.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeDb());
