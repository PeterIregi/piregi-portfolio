-- This database was created before the constraint lines were part of the table
-- definitions, so it holds none of the named constraints that migration 0000
-- declares: project_gallery has no composite primary key, and projects and
-- contact_submissions have no status CHECK. The consequences are not cosmetic:
--
--   * Without project_gallery_project_id_media_id_pk nothing enforces one row
--     per project/media pair, so `pnpm db:seed` appends another copy of every
--     gallery row on each run (its `onConflictDoNothing` has no unique
--     constraint to conflict against) and any read of the table can return the
--     same image several times.
--   * Without projects_status and contact_status an out-of-range status can be
--     written. Public queries filter status = 'published', so this leaks no
--     draft, but the database stops being the last line of defence.
--
-- Migration 0000 is applied and must not be edited (design.md §8), so this
-- migration converges the drifted database onto the schema 0000 already claims.
-- Every statement is a no-op where its constraint is already present, which
-- keeps one migration safe to apply to both dev and production.

-- 1. Collapse the duplicates the missing primary key allowed to accumulate.
--    ctid is a physical row location, so which row survives is arbitrary; what
--    matters is that exactly one row survives each project/media pair.
DELETE FROM "project_gallery" "stale"
USING "project_gallery" "keep"
WHERE "stale"."project_id" = "keep"."project_id"
	AND "stale"."media_id" = "keep"."media_id"
	AND "stale"."ctid" < "keep"."ctid";
--> statement-breakpoint
-- 2. project_gallery's composite primary key. Adding it is what stops the seed
--    from duplicating rows, so it has to come after the dedupe above.
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM "pg_constraint"
		WHERE "conrelid" = 'project_gallery'::regclass
			AND "conname" = 'project_gallery_project_id_media_id_pk'
	) THEN
		ALTER TABLE "project_gallery"
			ADD CONSTRAINT "project_gallery_project_id_media_id_pk" PRIMARY KEY ("project_id", "media_id");
	END IF;
END $$;
--> statement-breakpoint
-- 3. The two status CHECKs. `pnpm db:check` reports any declared constraint the
--    database does not have, so these lines exist to make that check pass
--    everywhere rather than to describe a known gap.
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM "pg_constraint"
		WHERE "conrelid" = 'projects'::regclass
			AND "conname" = 'projects_status'
	) THEN
		ALTER TABLE "projects"
			ADD CONSTRAINT "projects_status" CHECK ("projects"."status" IN ('draft', 'published'));
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM "pg_constraint"
		WHERE "conrelid" = 'contact_submissions'::regclass
			AND "conname" = 'contact_status'
	) THEN
		ALTER TABLE "contact_submissions"
			ADD CONSTRAINT "contact_status" CHECK ("contact_submissions"."status" IN ('new', 'read', 'archived'));
	END IF;
END $$;
