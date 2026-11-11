import { inArray } from "drizzle-orm";
import { db } from "./client";
import { mediaAssets } from "./schema";

/**
 * Admin routes accept media ids from a picker, so a stale tab can submit an id
 * that no longer exists. Checking before the insert turns the foreign-key
 * violation into a message that names the missing image instead of a generic
 * "failed to save" (AGENTS.md error handling).
 */
export async function findMissingMediaIds(ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];

  const rows = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(inArray(mediaAssets.id, unique));

  const found = new Set(rows.map((row) => row.id));
  return unique.filter((id) => !found.has(id));
}
