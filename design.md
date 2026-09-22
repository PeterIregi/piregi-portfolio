# Design Document: Piregi Portfolio

This document records the architecture and schema decisions for this
project. It exists so both humans and AI agents building on this repo
make consistent choices instead of re-deriving architecture per feature.
Read it together with [`prd.md`](./prd.md) (what to build) and
[`AGENTS.md`](./AGENTS.md) (coding conventions derived from these
decisions). Process lives in [`WORKFLOW.md`](./WORKFLOW.md).

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, TypeScript), full-stack | PRD §7 requires SSR/SSG for SEO and PRD §8 suggests Next.js; Server Components render public pages, Server Actions + route handlers cover admin CRUD and forms, so there is no separate API to deploy (owner's stack answer, Sep 2026) |
| Hosting | Vercel | Native Next.js deploys, preview deploys per PR branch, env scoping between preview and production (owner's answer; matches PRD §8) |
| Database | Supabase Postgres, accessed through Drizzle ORM | Managed backups satisfy PRD §7 reliability; one vendor for DB and file storage; Drizzle gives typed queries and SQL migrations that work from Server Actions (owner's answer) |
| File storage | Supabase Storage | CV PDFs and project images (PRD §4.3, §6); CV bucket is private and served only through the counting endpoint, image bucket is public (see §4, §5) |
| Auth | Auth.js (NextAuth v5), credentials provider, bcrypt hashes, JWT session cookies | PRD §4.2 requires email/password login, session management, and password reset; Auth.js was the owner's pick and leaves an OAuth provider slot open for the optional SSO later |
| Styling | Tailwind CSS with a project-defined token set | Brand system is built from scratch (owner's answer to PRD §12 Q4); tokens live in the Tailwind theme, not scattered hex values (see §10) |
| Validation | Zod, shared schemas | One schema per shape, reused by Server Actions and forms so the client and server can't drift (see §6, `src/lib/validation/`) |
| Email | Resend | Contact-form notification to the owner and password-reset mail (PRD §8; owner's pick). Only `src/lib/email/` talks to the SDK |
| Analytics | First-party `page_views` table + a path-only beacon | PRD §3.1 asks for basic page views; owner chose first-party over Plausible/Umami. CV downloads and contact submissions are already counted in their own tables |

## 2. Data model / schema (v1)

Drizzle schema, `src/lib/db/schema.ts`. Derived from PRD §6 and the
flows in PRD §4.3 (CV), §4.1 (contact), §4.2 (admin CRUD).

```ts
users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  role: text('role').notNull().default('admin'), // single role in v1, PRD §11
  lastLogin: timestamp('last_login', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }), // null = still valid
})

projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  summary: text('summary').notNull(),
  description: text('description').notNull(),
  coverMediaId: uuid('cover_media_id').references(() => mediaAssets.id),
  techStack: text('tech_stack').array().notNull().default([]),
  tags: text('tags').array().notNull().default([]),
  projectUrl: text('project_url'),
  repoUrl: text('repo_url'),
  status: text('status').notNull().default('draft'), // 'draft' | 'published'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

projectGallery = pgTable('project_gallery', {
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  mediaId: uuid('media_id').notNull().references(() => mediaAssets.id, { onDelete: 'cascade' }),
  position: integer('position').notNull().default(0),
})

experiences = pgTable('experiences', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleTitle: text('role_title').notNull(),
  organization: text('organization').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'), // null = ongoing
  description: text('description').notNull(),
  type: text('type').notNull(), // 'work' | 'education' | 'certification'
  sortOrder: integer('sort_order').notNull().default(0),
})

skills = pgTable('skills', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  proficiency: integer('proficiency'), // 1-5, nullable per PRD §4.1 "optional"
})

testimonials = pgTable('testimonials', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorName: text('author_name').notNull(),
  authorTitle: text('author_title').notNull(),
  company: text('company'),
  quote: text('quote').notNull(),
  avatarMediaId: uuid('avatar_media_id').references(() => mediaAssets.id),
  sortOrder: integer('sort_order').notNull().default(0),
})

cvFiles = pgTable('cv_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  storagePath: text('storage_path').notNull(), // key in the private CV bucket
  originalFilename: text('original_filename').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  isActive: boolean('is_active').notNull().default(false),
  downloadCount: integer('download_count').notNull().default(0),
}, (t) => [
  // At most one active CV ever exists; this is the DB-level half of §7
  uniqueIndex('cv_files_one_active').on(t.isActive).where(sql`${t.isActive} = true`),
])

contactSubmissions = pgTable('contact_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  message: text('message').notNull(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  status: text('status').notNull().default('new'), // 'new' | 'read' | 'archived'
})

mediaAssets = pgTable('media_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  storagePath: text('storage_path').notNull(),
  publicUrl: text('public_url').notNull(),
  altText: text('alt_text'), // required before publish use, PRD §7 a11y
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
})

siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),        // e.g. 'meta', 'socials', 'brand'
  value: jsonb('value').notNull(),
})

pageViews = pgTable('page_views', {
  id: bigint('id', { mode: 'bigint' }).primaryKey().generatedAlwaysAsIdentity(),
  path: text('path').notNull(),         // path only, no cookies/IPs, PRD §4.3
  viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [index('page_views_path_time').on(t.path, t.viewedAt)])
```

Intentionally deferred, with the PRD section that owns the decision:

- No `articles` / blog table and no `/blog` routes: blog deferred to v2
  (owner's answer to PRD §12 Q2; PRD §11 flags blog as a scope-creep risk).
- No email/lead column anywhere on CV downloads: CV stays fully open
  (owner's answer to PRD §12 Q1; matches PRD §4.3's aggregate-only note).
- No public metrics columns on `projects`: view counts stay admin-only
  (owner's answer to PRD §12 Q3).
- `users.role` exists but only ever holds `admin` in v1: single-owner
  assumption from PRD §11; no permission matrix.

## 3. Core business logic

Three rules must hold everywhere, each owned by exactly one module:

1. **Active CV selection.** `getActiveCv()`, `activateCv(id)`, and
   `deleteCv(id)` live in `src/lib/db/cv.ts` and nowhere else touches
   `cv_files.is_active`. The partial unique index (§2) is the DB half;
   these functions are the app half. Activation runs as a transaction:
   deactivate all, activate one.
2. **Published-only public reads.** Public pages never query
   `projects`/`experiences`/etc. directly. They go through
   `src/lib/db/queries/public.ts` (`listPublishedProjects`,
   `getPublishedProjectBySlug`, ...), which filters `status = 'published'`
   so a draft can't leak by a forgotten `where` clause.
3. **Authorization entry point.** Every Server Action and admin route
   handler starts with `requireAdmin()` from `src/lib/auth/guards.ts`.
   There is no second pattern for "check if logged in".

## 4. Authorization / access control

Two trust levels: anonymous public visitors, and the single admin
(PRD §11). Enforcement is application-level: `requireAdmin()` in every
server mutation, plus DB/storage configuration below. **Hiding a route in
the UI or a query filter in a component is never enforcement**, and
`middleware.ts` alone is not either: middleware only redirects
unauthenticated *page* visits to `/admin/login` for UX. The guard call in
the action/handler is the check.

| Resource | Public read | Public write | Admin |
|---|---|---|---|
| `projects` (published) | Yes, via `queries/public.ts` | No | Full CRUD |
| `projects` (draft) | No | No | Full CRUD |
| `experiences`, `skills`, `testimonials`, about/bio content | Yes, via public queries | No | Full CRUD |
| `site_settings` | Yes (nav socials, meta need it to render) | No | Write via `/admin/settings` |
| `media_assets` (image bucket) | Yes, images are meant to be seen | No | Upload/delete |
| CV file bytes | Yes, but only through `GET /api/cv/download`, which also increments the counter; the CV storage bucket is **private** | No | Upload/activate/revert/delete |
| `cv_files` metadata (list, counts) | Only `getActiveCv()` fields needed for the CV page (id, date) | No | Full list in `/admin/cv` |
| `contact_submissions` | No | Insert only via the contact Server Action (Zod validation + honeypot + rate limit, PRD §4.1/§7) | Read, set status, delete |
| `users`, `password_reset_tokens` | No | Password-reset *request* is public (email only, no existence disclosure in the response) | Managed via auth flows |

Additional rules that fall out of PRD §7:

- Login attempts are rate-limited per email+IP before bcrypt runs
  (implement in the login action).
- Upload validation (PDF MIME + extension, ≤10MB for CV; allowlisted
  image types for media) runs **server-side inside the upload action**.
  Client-side checks are a UX nicety, not the boundary.
- Session cookie: `httpOnly`, `Secure`, `SameSite=Lax`, 7-day expiry
  (Auth.js config in `src/lib/auth/`).

## 5. External integrations

**Email (Resend).** All provider-specific code lives in
`src/lib/email/`. The rest of the app calls two functions:
`sendContactNotification(submission)` and `sendPasswordReset(email, url)`.
If `RESEND_API_KEY` is unset and `NODE_ENV === 'development'`, the module
logs the message to the console instead of throwing, so local work never
depends on a real key. Never import `@resend/resend` outside this folder.

**File storage (Supabase Storage).** All storage code lives in
`src/lib/storage/`: `uploadCv(file)`, `uploadImage(file)`,
`getCvSignedPath()`, `deleteObject(path)`. Two buckets:
`cv-images` (public, project/bio images) and `cv-files` (private, PDFs).
Never import `@supabase/storage-js` (or the supabase JS client) outside
this folder. The download endpoint in §4 is the only code that hands out
CV bytes.

**Spam protection (PRD §4.1, provider undecided).** The integration point
will be `src/lib/spam/verify(token)` called from the contact action.
Which provider (see §12) is an open decision; the call site is not.

## 6. File/module structure

```
src/
  app/
    (site)/                 # public layout: nav (persistent Download CV CTA), footer, socials
      page.tsx              # home: hero + featured projects
      about/ projects/ projects/[slug]/ experience/ cv/ contact/
    admin/
      login/
      page.tsx              # dashboard home: recent messages, download/visit counts
      projects/ experience/ skills/ testimonials/ cv/ media/ messages/ settings/
    api/
      cv/download/route.ts  # serves active PDF + atomic count increment (§7)
      analytics/viewed/route.ts  # path-only page-view beacon
    layout.tsx  globals.css  sitemap.ts  robots.ts
  components/
    site/                   # public-facing UI only
    admin/                  # admin UI only; never imported by (site)
    ui/                     # shared primitives (Button, Input, ...)
  actions/                  # Server Actions: contact.ts, cv.ts, projects.ts,
                            # content.ts, media.ts, messages.ts, settings.ts
  lib/
    auth/                   # Auth.js config + guards.ts (requireAdmin)
    db/                     # schema.ts, cv.ts, queries/public.ts, queries/admin.ts
    email/                  # Resend only
    storage/                # Supabase storage only
    spam/                   # CAPTCHA verification (provider TBD, §12)
    validation/             # Zod schemas, one per form/API shape
  middleware.ts             # /admin page redirect only, not the auth boundary
```

What does NOT belong where:

- No DB queries in components; pages call `lib/db/queries/*` or actions.
- No `components/admin/*` imports from `app/(site)`, and no
  `lib/db/queries/admin.ts` usage in public pages.
- No provider SDK imports outside `lib/email/` and `lib/storage/`.
- No API routes for content CRUD: admin mutations are Server Actions in
  `actions/`. Route handlers exist only for the two endpoints above
  (external POST surface) and Auth.js's own routes.

## 7. Concurrency & idempotency

No money or inventory, but two spots can corrupt state under a
double-click or two open tabs:

1. **Two simultaneous CV activations.** Failure mode: two rows end up
   `is_active = true` (or a lost update leaves zero active). Fix:
   `activateCv()` runs deactivate-all + activate-one in one transaction,
   and the partial unique index `cv_files_one_active` (§2) makes a
   second concurrent activation fail loudly instead of silently
   committing. Never `UPDATE cv_files SET is_active = ...` ad hoc.
2. **Concurrent CV downloads.** Failure mode: read `download_count`,
   add 1, write back loses increments. Fix: single atomic statement
   `UPDATE cv_files SET download_count = download_count + 1 WHERE id = ...`
   in the download route, then stream the file.

Contact-form duplicates are acceptable (two real emails are worse than
one duplicate row); no idempotency key needed there.

## 8. Environments

Two, plus local:

| Env | DB / storage | Deploy |
|---|---|---|
| local | Supabase dev project (hosted; no local Supabase stack to run) | `pnpm dev` |
| preview | Supabase dev project, same as local | Vercel preview deploy per PR branch |
| production | Separate Supabase **production** project | Vercel production, `main` only |

Hard rule: production env vars (`DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`) are scoped to the Vercel production
environment only. A preview deploy must never resolve to the production
database; that is how a test migration or a deleted row becomes an
outage (design intent behind PRD §7's reliability line).

## 9. Observability

- **Must not fail silently:** the contact-notification email (a thrown
  error here means a lost inquiry; log it with the submission id), the
  CV download counter update, and `requireAdmin()` rejections.
- **Backups:** Supabase automated backups cover both DB and storage
  objects (PRD §7). Verified as part of the launch milestone, not assumed.
- **Tests worth having** (the things in this doc that break invisibly):
  - `activateCv` leaves exactly one active row when called twice
    concurrently (§7).
  - The download route increments exactly once per request (§7).
  - `requireAdmin` rejects missing, expired, and forged sessions (§4).
  - Public project queries never return `status = 'draft'` (§3).
  Generic component snapshot tests are not worth writing here.

## 10. Frontend/UX principles

This is a client-facing personal brand site (PRD §1.2) and the brand
system is built from scratch (owner's answer to PRD §12 Q4). The
`frontend-design` skill applies at UI build time; these are the
constraints it works within:

- Define the design system first, in the Tailwind theme: type scale,
  color tokens (including light/dark pairs if the toggle ships), spacing.
  Components consume tokens; a raw hex value in a component is a bug.
- Required quality bars from PRD §7: WCAG 2.1 AA (alt text everywhere,
  keyboard nav, contrast), responsive at mobile/tablet/desktop,
  Lighthouse ≥90 on performance/accessibility/SEO.
- Patterns to avoid, because they are what makes AI-built portfolios
  read as generic: gradient-blob heroes, arrow-suffixed buttons
  ("View Work →" on every card), numbered section markers on
  non-sequential content, uniform fade-in-on-scroll on every element,
  and default Inter-as-the-only-typeface with no hierarchy decision.
  Pick a deliberate type pairing and one accent strategy.
- Content dependency: real bio, project write-ups, photo, and CV must
  arrive before public pages get final polish (PRD §11 assumption);
  build against seed data first (WORKFLOW M2/M3).
- Dark/light toggle is PRD §4.1 "Could": v1 ships light-only; the
  toggle is the optional last issue of the launch milestone (§12).

## 11. Legal & compliance

The contact form stores personal data (name, email, message) and the
admin can read it. Consequences that shape the build:

- Contact submissions are admin-only readable (§4) and deletable from
  the inbox, so an access/deletion request is answerable without DB
  surgery.
- The page-view beacon sends path + timestamp only. No cookies, no IPs,
  no fingerprinting (extends PRD §4.3's "no PII beyond aggregate" from
  CV downloads to all analytics).
- If the owner's audience includes the EU, GDPR applies to those
  submissions; a one-paragraph privacy notice on the contact page is a
  launch-milestone item, not a v2 discovery.

## 12. Open decisions

Explicitly undecided or deferred, so nobody silently resolves them:

1. **CAPTCHA provider** for the contact form (PRD §4.1 requires spam
   protection, names none). Front-runner is Cloudflare Turnstile
   (free, privacy-light); hCaptcha is the alternative. Integration point
   is fixed: `src/lib/spam/verify()`.
2. **OAuth/SSO login** (PRD §4.2 marks it optional): deferred; Auth.js
   makes it an added provider, no schema change.
3. **Blog/articles** (PRD §12 Q2): deferred to v2 by owner decision.
4. **Email capture on CV downloads** (PRD §12 Q1): deferred; CV stays
   open. Adding a gate later means a new table, not a column on
   `cv_files`.
5. **Public view counts** (PRD §12 Q3): deferred; analytics display is
   admin-only.
6. **Dark/light toggle timing**: scheduled as the final optional issue
   of M7 (WORKFLOW.md); if cut, v1 ships light-only and the toggle
   moves to the v2 backlog.
