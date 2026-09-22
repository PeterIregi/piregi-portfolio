# WORKFLOW.md: Git flow, milestones, and issues

**Read this file before making any change, and again before committing or
pushing.** It defines how work is branched, committed, and closed out in
this repo. It complements [`prd.md`](./prd.md) (what to build),
[`design.md`](./design.md) (architecture), and [`AGENTS.md`](./AGENTS.md)
(coding conventions). This file governs process, not code.

Milestones and issues below are meant to be created in GitHub before work
starts (Milestones tab + Issues tab), using these exact names/
descriptions. Once created, every commit and PR references the issue it
belongs to.

---

## 1. Branching

- `main` is always deployable. No direct commits to `main`.
- One branch per issue, branched from `main`:
  ```
  <type>/<issue-number>-<short-slug>
  ```
- `<type>` matches the commit type table in §2.
- Keep a branch scoped to its issue. If work reveals a second, unrelated
  issue, open a new issue and a new branch. Don't scope-creep one branch.

## 2. Commit message format

Conventional Commits, referencing the issue number:

```
<type>(<scope>): <short summary> (#<issue-number>)
```

| type | use for |
|---|---|
| `feat` | a new feature or capability |
| `fix` | a bug fix |
| `chore` | tooling, deps, config, no behavior change |
| `docs` | documentation only |
| `refactor` | code change that isn't a fix or a feature |
| `test` | adding or fixing tests |
| `style` | formatting only, no logic change |

`<scope>` is the affected area: `infra`, `auth`, `db`, `site`, `admin`,
`cv`, `email`, `analytics`, `media`, `seo`, `ui`. Match folder/domain
names from `design.md` where possible.

Rules:

- One logical change per commit.
- Every commit for an issue includes that issue's number, even across
  multiple commits, so commits can be grouped by issue later.
- Summary in the imperative mood ("add", not "added"/"adds").
- Optional body explains *why*, not *what*.

## 3. Grouping commits and writing the PR description

Before pushing a finished issue's branch, group and present its commits
chronologically, then add a PR description block below the group, ready
to paste into GitHub's PR description field:

```
## Issue #<N>: <issue title>

- <type>(<scope>): <summary> (#<N>)
- <type>(<scope>): <summary> (#<N>)

---
Closes #<N>

<one or two sentences on what this PR does and any follow-up left for a
later issue.>
```

- Use **`Closes #<N>`** as the default closing keyword unless the issue
  is explicitly a bug report, then use `Fixes #<N>`.
- Prefer one issue per PR. If a PR must address more than one, list every
  issue with its own closing keyword on its own line.
- PR title matches the issue title.

## 4. Before committing/pushing: checklist

- [ ] Branch name matches `<type>/<issue-number>-<short-slug>`.
- [ ] Every commit message follows the format in §2.
- [ ] Commits are grouped and listed chronologically for review.
- [ ] The PR description block (§3) is generated and ready to paste.
- [ ] The relevant `AGENTS.md` "Definition of done" items pass for
      anything the issue touched.
- [ ] `design.md` §10 quality bar holds for any new UI (tokens, no raw
      hex, responsive, accessible).

---

## 5. Milestones

The sequence follows `design.md`'s build order and prd §10: foundation
and schema first, then the features that read and write that data, then
integration and launch. Blog, email gate on CV, and public metrics are
absent because they are v2 by owner decision (design.md §12).

### Milestone 1: Project Setup & Infrastructure
Repo, dev tooling, design tokens, database and deployment pipeline in
place. Nothing user-facing yet.

### Milestone 2: Auth & Data Foundation
Schema applied, migrations workflow working, admin login and the
`requireAdmin` boundary established. Everything after this depends on it
(design.md §4).

### Milestone 3: Public Portfolio Site
All visitor-facing pages render from seed data via `queries/public.ts`,
satisfying prd §4.1. Builds against seed content, not final copy
(design.md §10).

### Milestone 4: Admin CMS & Media Library
Content CRUD, media library, messages inbox, and settings editor behind
`requireAdmin()` (prd §4.2).

### Milestone 5: CV Upload, Versioning & Download
Upload, activate/revert/delete, the counting download endpoint, and the
admin counts view (prd §4.3, design.md §3/§7).

### Milestone 6: Notifications & Analytics
Contact-form email via Resend, the first-party page-view beacon, and the
admin dashboard overview showing visits, downloads, and recent messages
(prd §3.1, §4.2, design.md §5/§9).

### Milestone 7: Polish, QA & Launch
Performance, accessibility, SEO verification per prd §7, production
deploy, and smoke tests. Optional dark/light toggle lives at the end of
this milestone (design.md §12).

---

## 6. Issues

> Issue numbers match the live issues in GitHub; list each milestone's
> issues in ascending number order. Every commit references the number of
> the issue it belongs to.

### Milestone 1: Project Setup & Infrastructure

**#1: Scaffold Next.js, Drizzle, and Tailwind project**
Create the App Router project in TypeScript strict mode with pnpm,
drizzle-kit wired, and eslint + prettier configured. Add the env var
loading and `.env.example` per design.md §8.

**#2: Create Supabase dev and production projects and wire env vars**
Set up both Supabase projects (Postgres + storage buckets `cv-images`
and `cv-files` per design.md §4/§5), populate env vars, and document the
migration workflow (`pnpm db:migrate`) in the README.

**#3: Define design tokens and base UI primitives**
Per design.md §10: Tailwind theme with type scale, color tokens, and
spacing; Button/Input/Container primitives consuming tokens only. No
component-specific hex values.

**#4: Configure Vercel project with env scoping**
Attach the repo to Vercel with preview and production environments;
scope `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY` to
production only per design.md §8.

### Milestone 2: Auth & Data Foundation

**#5: Write the v1 Drizzle schema and initial migration**
All tables from design.md §2 (`users`, `password_reset_tokens`,
`projects`, `project_gallery`, `experiences`, `skills`, `testimonials`,
`cv_files` with the partial unique index, `contact_submissions`,
`media_assets`, `site_settings`, `page_views`). Generate and apply the
first migration (design.md §2, §8).

**#6: Implement admin login with rate limiting**
Auth.js credentials provider, bcrypt hashing, 7-day httpOnly session
cookie, and per-email+IP login rate limiting in the login action
(design.md §4, prd §7).

**#7: Implement password reset flow**
Request action that emails a single-use token via `sendPasswordReset()`,
plus the reset action that validates expiry and hashes the new password.
No existence disclosure in the response (design.md §4/§5).

**#8: Implement requireAdmin and wire the admin auth boundary**
`src/lib/auth/guards.ts` with `requireAdmin()`; call it in every admin
Server Action established so far. `middleware.ts` redirects unauthenticated
admin page visits for UX only (design.md §4, §6).

**#9: Write the seed script**
Sample projects, experience, skills, testimonials, settings, and the
first contact submission so public pages and the admin have data before
real content arrives (design.md §10).

### Milestone 3: Public Portfolio Site

**#10: Build the public site layout**
Nav with persistent Download CV CTA (linking to `/cv`), footer with
social links read from `site_settings`, and the base layout. Uses
`frontend-design` skill; tokens only (design.md §10).

**#11: Build the home page**
Hero (name, title, short intro, CTAs), featured published projects, and
a summary section, all read via `queries/public.ts` (prd §4.1/§5).

**#12: Build the About page**
Bio, photo from the media library, skills, and values from their tables
(prd §4.1).

**#13: Build projects list and detail pages**
Grid with tags/category filters on `/projects` and detail pages at
`/projects/[slug]` with gallery, description, tech stack, and links.
Never render `status = 'draft'` (design.md §3).

**#14: Build the Experience timeline**
Work, education, and certifications ordered by `sortOrder`, styled as a
timeline (prd §4.1).

**#15: Build Skills and Testimonials sections**
Categorized skills with optional proficiency, and the testimonials
rotator/list with alt-text on avatars (prd §4.1, §7).

**#16: Build the contact form and server action**
Zod validation, honeypot field, and login-rate-limit-from-#6-style rate
limit on submissions; generic success message with specific errors logged
server-side (design.md §4, §6).

**#17: Build the CV page**
Show the active CV's last-updated date and a view/download action routed
through `GET /api/cv/download`; never link to the storage bucket directly
(design.md §4, prd §4.3).

**#18: Add SEO metadata, sitemap, robots, and structured data**
Per-page titles/descriptions, Open Graph tags, `sitemap.ts` and
`robots.ts`, and schema.org Person/CreativeWork JSON-LD (prd §4.1/§7).

### Milestone 4: Admin CMS & Media Library

**#19: Build the admin shell**
Sidebar navigation to all admin sections and the dashboard home page
skeleton showing recent messages, CV download count, and site visits
(prd §4.2).

**#20: Build projects CRUD**
List, create, and edit screens with slug generation and draft/published
status, behind `requireAdmin()` (prd §4.2, design.md §4).

**#21: Build experience, skills, testimonials, and about/bio CRUD**
One issue covering the simple content types per design.md §2; each field
maps to a schema column; reorder controls for `sortOrder` fields.

**#22: Build the media library**
Image upload to the `cv-images` bucket with server-side type/size
validation, alt text capture, and a picker used by project covers,
galleries, testimonial avatars, and the About photo (prd §4.2, design.md
§4/§5).

**#23: Build the contact submissions inbox**
List with new/read/archived status, mark-read and archive actions, and a
reply-via-mailto link (prd §4.2).

**#24: Build the site settings editor**
Edit meta info, social links, and brand settings stored in `site_settings`;
reads that public pages already consume (prd §4.2, ground rule 9).

### Milestone 5: CV Upload, Versioning & Download

**#25: Build CV upload with validation**
Upload action enforcing PDF MIME + extension and ≤10MB server-side,
storing in the private `cv-files` bucket and creating a `cv_files` row.
New upload becomes active via `activateCv` (prd §4.3, design.md §4/§7).

**#26: Build CV activate/revert/delete actions**
All through `src/lib/db/cv.ts` with the atomic deactivate-all +
activate-one transaction; delete removes the file from storage too.
Version history lists every upload with its date and download count
(design.md §3/§7).

**#27: Build the counting download endpoint**
`GET /api/cv/download`: validate active CV exists, increment
`download_count` atomically in one statement, then serve the PDF
(design.md §3/§7).

**#28: Show download counts in the admin CV screen**
Per-version and total download counts surfaced in `/admin/cv` via
`queries/admin.ts` (prd §4.3).

### Milestone 6: Notifications & Analytics

**#29: Send contact notification via Resend**
`sendContactNotification()` called from the contact action when a
submission passes validation, with console fallback in dev when
`RESEND_API_KEY` is unset. Delivery failures log with the submission id
(design.md §5/§9).

**#30: Build the page-view beacon and admin overview**
`/api/analytics/viewed` inserting path + timestamp only; the dashboard
home renders visits, CV download count, and recent submissions, all
admin-only (design.md §4, §9, §11).

### Milestone 7: Polish, QA & Launch

**#31: Performance pass to Lighthouse ≥90**
Audit ISR/SSG settings, image optimization, and font strategy; fix what
fails the prd §7 bar.

**#32: Accessibility audit to WCAG 2.1 AA**
Alt text, keyboard navigation, contrast, and focus states across public
and admin surfaces (prd §7, design.md §10).

**#33: Production deploy, smoke test, and backup check**
Deploy `main`, smoke-test login/CV/contact in production, add the contact
page privacy notice, and verify Supabase backups are actually taking
(design.md §9/§11, prd §7).

**#34: Optional: dark/light theme toggle**
Only if the M7 budget survives everything above; ships as the final issue
or defers to the v2 backlog unchanged (design.md §12 item 6).