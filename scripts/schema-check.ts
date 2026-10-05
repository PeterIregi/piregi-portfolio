// Next.js loads .env.local for the app itself; a plain tsx script has to do
// it by hand.
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

/**
 * Compares the constraints and indexes the migration files declare against the
 * ones the connected database actually has.
 *
 * `drizzle-kit generate` only diffs schema.ts against the snapshot files, so it
 * reports "nothing to migrate" even when the database never received a
 * statement the migrations claim to have applied. That is exactly how
 * project_gallery ended up without its composite primary key while
 * 0000_jazzy_stark_industries.sql declares one (#60). This script is the check
 * for that whole class of drift: run it after `pnpm db:migrate`, and it fails
 * loudly instead of letting `onConflictDoNothing` silently insert duplicates.
 */

const MIGRATIONS_DIR = "drizzle";

type Declared = {
  constraints: Set<string>;
  indexes: Set<string>;
  tables: Set<string>;
};

// Migration SQL quotes identifiers, so names are captured from the quoted
// token that follows the statement keyword rather than by a general SQL parse.
// One constraint pattern covers both spellings the migrations use: inline in
// CREATE TABLE and via ALTER TABLE ... ADD CONSTRAINT.
const CONSTRAINT_RE = /CONSTRAINT\s+"([^"]+)"/gi;
const INDEX_RE = /CREATE (?:UNIQUE )?INDEX\s+(?:IF NOT EXISTS\s+)?"([^"]+)"/gi;
const TABLE_RE = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?"([^"]+)"/gi;

async function readDeclared(): Promise<Declared> {
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const declared: Declared = {
    constraints: new Set(),
    indexes: new Set(),
    tables: new Set(),
  };

  for (const file of files) {
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    for (const [, name] of sql.matchAll(CONSTRAINT_RE)) declared.constraints.add(name);
    for (const [, name] of sql.matchAll(INDEX_RE)) declared.indexes.add(name);
    for (const [, name] of sql.matchAll(TABLE_RE)) declared.tables.add(name);
  }

  return declared;
}

function assert(ok: boolean, label: string, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail && !ok ? ` -> ${detail}` : ""}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const sql = postgres(url, { max: 1, prepare: false });
  const declared = await readDeclared();
  console.log(
    `      ${declared.constraints.size} constraints, ${declared.indexes.size} indexes, ` +
      `${declared.tables.size} tables declared across migrations`
  );

  const liveTables = new Set(
    (
      await sql<{ tablename: string }[]>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `
    ).map((r) => r.tablename)
  );

  const missingTables = [...declared.tables].filter((t) => !liveTables.has(t));
  for (const name of missingTables) console.log(`      missing table: ${name}`);
  assert(
    missingTables.length === 0,
    `all ${declared.tables.size} declared tables exist`,
    `${missingTables.length} missing`
  );
  // A missing table would make every other assertion below meaningless, since
  // the checks all run over the live catalog.
  if (missingTables.length) {
    await sql.end();
    console.log("\nFAILURES ABOVE");
    return;
  }

  // Querying the whole catalog at once keeps this to two round trips instead
  // of one per constraint.
  const liveConstraints = new Set<string>();
  const tablesWithPrimaryKey = new Set<string>();
  for (const row of await sql<{ conname: string; table_name: string; contype: string }[]>`
    SELECT c.conname, t.relname AS table_name, c.contype
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
  `) {
    liveConstraints.add(row.conname);
    if (row.contype === "p") tablesWithPrimaryKey.add(row.table_name);
  }

  const liveIndexes = new Set<string>(
    (
      await sql<{ indexname: string }[]>`
        SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
      `
    ).map((r) => r.indexname)
  );

  const missingConstraints = [...declared.constraints].filter((c) => !liveConstraints.has(c));
  const missingIndexes = [...declared.indexes].filter((i) => !liveIndexes.has(i));
  // Single-column primary keys are written inline in CREATE TABLE and so carry
  // no name to match on; their presence is checked per table instead.
  const missingPrimaryKeys = [...declared.tables].filter((t) => !tablesWithPrimaryKey.has(t));

  for (const name of missingConstraints) console.log(`      missing constraint: ${name}`);
  for (const name of missingIndexes) console.log(`      missing index: ${name}`);
  for (const name of missingPrimaryKeys) console.log(`      no primary key on table: ${name}`);

  assert(
    missingConstraints.length === 0,
    `all ${declared.constraints.size} declared constraints exist`,
    `${missingConstraints.length} missing`
  );
  assert(
    missingIndexes.length === 0,
    `all ${declared.indexes.size} declared indexes exist`,
    `${missingIndexes.length} missing`
  );
  assert(
    missingPrimaryKeys.length === 0,
    `all ${declared.tables.size} declared tables have a primary key`,
    missingPrimaryKeys.join(", ")
  );

  // project_gallery's whole point is one row per project/media pair, and a
  // duplicate pair can only exist while its primary key is missing, so the
  // pair count is the cheapest direct check of the fix (#60).
  const [gallery] = await sql<{ rows: number; pairs: number }[]>`
    SELECT count(*)::int AS rows, count(DISTINCT (project_id, media_id))::int AS pairs
    FROM project_gallery
  `;
  assert(
    gallery.rows === gallery.pairs,
    `project_gallery has no duplicate project/media pairs (${gallery.rows} rows)`,
    `${gallery.rows} rows for ${gallery.pairs} pairs`
  );

  await sql.end();
  console.log(process.exitCode ? "\nFAILURES ABOVE" : "\nall schema checks passed");
}

main().catch((error) => {
  console.error("schema check threw:", error);
  process.exit(1);
});
