import { db } from "@/lib/db";
import { cvFiles } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

/**
 * Single owner of the cv_files lifecycle. All activation, insertion, and
 * deletion of CV rows goes through here so the partial unique index
 * (cv_files_one_active) can never be violated by e.g. two rows flipped to
 * true at once. Do not raw-`UPDATE cv_files` elsewhere (AGENTS.md §2).
 */

export function getActiveCv() {
  return db
    .select()
    .from(cvFiles)
    .where(eq(cvFiles.isActive, true))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export function getCvById(id: string) {
  return db
    .select()
    .from(cvFiles)
    .where(eq(cvFiles.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export function listCvs() {
  return db.select().from(cvFiles).orderBy(desc(cvFiles.uploadedAt));
}

/**
 * Insert a new CV and make it the active one in a single transaction:
 * deactivate-all + insert-active. Because both writes happen in one
 * transaction, the partial unique index is never left mid-state.
 */
export async function insertActiveCv(input: { storagePath: string; originalFilename: string }) {
  return db.transaction(async (tx) => {
    await tx.update(cvFiles).set({ isActive: false }).where(eq(cvFiles.isActive, true));
    const [cv] = await tx
      .insert(cvFiles)
      .values({ ...input, isActive: true, downloadCount: 0 })
      .returning();
    return cv;
  });
}

/**
 * Make the given CV the single active row. Runs deactivate-all +
 * activate-one in one transaction (AGENTS.md §2, design.md §7).
 */
export async function activateCv(id: string) {
  return db.transaction(async (tx) => {
    await tx.update(cvFiles).set({ isActive: false }).where(eq(cvFiles.isActive, true));
    const [cv] = await tx
      .update(cvFiles)
      .set({ isActive: true })
      .where(eq(cvFiles.id, id))
      .returning();
    return cv ?? null;
  });
}

/** Delete a CV row. Returns the deleted row, or null if it did not exist. */
export async function deleteCv(id: string) {
  const [deleted] = await db.delete(cvFiles).where(eq(cvFiles.id, id)).returning();
  return deleted ?? null;
}

/** Guard: a CV can only be deleted if a different CV is active or none is. */
export async function isCvIdDeletable(id: string) {
  const [active] = await db
    .select({ id: cvFiles.id })
    .from(cvFiles)
    .where(and(eq(cvFiles.isActive, true), eq(cvFiles.id, id)))
    .limit(1);
  return !active;
}