# Instructions for AI agents building this repo

Read this together with [`prd.md`](./prd.md) (what to build),
[`design.md`](./design.md) (architecture and schema decisions already
made), and [`WORKFLOW.md`](./WORKFLOW.md) (git flow, milestones, issues).
Don't re-derive architecture that `design.md` already decides. Follow it,
and if a decision there looks wrong, say so explicitly instead of
silently diverging.

**Before making any change, and again before committing or pushing, read
`WORKFLOW.md`.** It defines branch naming, commit message format, how to
group commits by issue, and the PR description block to produce once an
issue's work is ready to push. Every commit in this repo references the
GitHub issue it belongs to, per that file's format.

## Ground rules

1. **Don't invent new architecture for a solved problem.** `design.md`
   fixes the stack, schema, folder structure, and business logic. If a
   requirement isn't covered by `design.md` or `prd.md`, flag the gap
   instead of quietly choosing a convention of your own.
2. **The active CV is managed by exactly one module.** All reads,
   activation, revert, and delete of `cv_files` go through
   `src/lib/db/cv.ts` (`getActiveCv`, `activateCv`, `deleteCv`). A raw
   `UPDATE cv_files SET is_active = ...` anywhere else breaks the partial
   unique index intended by `design.md` §2/§7.
3. **Every server mutation starts with `requireAdmin()` from
   `src/lib/auth/guards.ts`.** This includes all content CRUD, CV
   management, media, messages, and settings actions. `middleware.ts` and
   the admin sidebar only hide pages from the UI; they are not the
   boundary (design.md §4).
4. **Public pages read content only through
   `src/lib/db/queries/public.ts`**, which filters `status='published'`
   and the active CV. Writing a query that reads `projects` directly in a
   page is how drafts leak (design.md §3).
5. **Providers stay behind their library folder.** Resend SDK imports
   only in `src/lib/email/`, Supabase storage only in `src/lib/storage/`,
   CAPTCHA verification only in `src/lib/spam/verify()`. Importing
   `@resend/resend` or the supabase JS client in a component or action is
   a violation (design.md §5).
6. **Upload validation runs server-side in the upload action.** PDF
   (MIME + extension) and ≤10MB for CV; allowlisted image types for
   media. Client-side checks are UI sugar, not enforcement (prd §4.3/§7,
   design.md §4).
7. **V1 scope is locked by `design.md` §2/§12 and prd §3.2.** No articles
   table, no `/blog` routes, no email gate on CV downloads, no public
   view counts, no multi-user roles. A v2 feature that looks easy is still
   not a v1 feature.
8. **Counters and the active flag are updated atomically.** The download
   route uses `download_count = download_count + 1` in one statement;
   `activateCv` runs deactivate-all + activate-one in one transaction.
   Never read-modify-write these fields (design.md §7).
9. **Data is data, not code.** Social links, meta info, bio, and skills
   are rows in `site_settings`/`skills`/etc. and are edited through the
   admin. Don't hardcode them in components to short-circuit the CMS
   (prd §4.2 content management).

## Conventions

- **Language**: TypeScript strict mode. eslint + prettier as configured
  in the scaffold; no `any` casts to dodge type errors.
- **Validation**: one Zod schema per shape in `src/lib/validation/`,
  shared by the Server Action and the form that calls it. A shape is
  defined once; don't redefine it per endpoint (design.md §1/§6).
- **Naming**: snake_case DB columns (Drizzle maps them), camelCase
  TypeScript identifiers, kebab-case file names, kebab-case slugs for
  projects. Tailwind theme spacing/colors by token name, not raw value.
- **File placement**: match `design.md` §6. Server Actions in `actions/`
  (no API routes for CRUD), public DB reads in
  `lib/db/queries/public.ts`, provider code in its library folder,
  admin components never imported from `app/(site)`.
- **Migrations**: Drizzle Kit, applied in sequence. An applied migration
  is never edited, only superseded by a new one (design.md §8's env rule
  assumes this discipline).
- **Error handling**: admin-facing surfaces say what actually failed and
  which field/value was rejected (e.g. "CV rejected: file must be PDF,
  under 10MB"); public forms return safe generic messages and log
  specifics server-side, so internals never leak to visitors
  (design.md §4/§5, §9).
- **Comments**: explain *why*, not *what*. Priorities: the CV
  activation transaction (`src/lib/db/cv.ts`), the guard ordering in
  `requireAdmin()`, and the atomic count update in the download route,
  since those are the spots easiest to break without noticing
  (design.md §7, §9).

## Definition of done for a feature

Derived by walking `design.md` and asking what the easiest accidental
violation of each decision is:

- [ ] If it touches the CV, it uses `src/lib/db/cv.ts`; activating
      leaves exactly one `is_active` row (design.md §2/§3/§7).
- [ ] Every new or touched Server Action / admin route handler begins
      with `requireAdmin()`; no admin data is reachable without a valid
      session (design.md §4).
- [ ] Public pages pull from `queries/public.ts` only; no draft content
      appears in a listing or detail view (design.md §3).
- [ ] Any new user-visible, DB-backed content renders from its table via
      queries/actions, not from a hardcoded array (prd §4.2).
- [ ] Uploads introduced or touched keep validation server-side and
      respect the by-bucket rules in design.md §4/§5.
- [ ] No import of a provider SDK outside `lib/email/`, `lib/storage/`,
      `lib/spam/` (design.md §5).
- [ ] No v2 feature shipped: no articles table/routes, no CV gate, no
      public metrics (design.md §2/§12, prd §3.2).
- [ ] New/changed UI matches the Tailwind theme tokens and passes the
      quality bar in design.md §10 (WCAG 2.1 AA, responsive); no raw hex
      divergences.
- [ ] Migrations are generated and applied locally; applied migrations
      are untouched (design.md §8).

## What NOT to do

- Don't add a second integration path that bypasses `src/lib/db/cv.ts`,
  `src/lib/email/`, or `src/lib/storage/` "just for this one thing":
  extend those modules instead.
- Don't build a v2 feature in v1: no blog (prd §12 Q2), no CV email
  gate (§12 Q1), no public view counts (§12 Q3), no OAuth (prd §4.2
  optional; §12 open decision).
- Don't rely on the admin UI or `middleware.ts` to protect a route:
  the boundary is `requireAdmin()` in the handler (design.md §4).
- Don't skip the seed step and "just fill it in later": public pages are
  built against seed data by design (design.md §10, WORKFLOW M2/M3).
- Don't hardcode meta/social/bio values in a component to skip the CMS
  (ground rule 9).