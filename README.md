# Piregi Portfolio

A personal/professional portfolio site with an admin dashboard and CMS:
the owner updates projects, bio, skills, and CV without touching code,
and visitors browse work, read about the owner, and download the current
CV (prd.md §1).

## Stack

- Next.js (App Router) + TypeScript, full-stack
- Supabase Postgres (Drizzle ORM) + Supabase Storage for CV PDFs and
  images
- Auth.js (credentials, email/password) for the admin
- Resend for contact notifications and password reset
- Tailwind CSS with project-defined design tokens
- Deployed on Render (native Node runtime, Blueprint in `render.yaml`); dev +
  production Supabase projects. See [DEPLOYMENT.md](./DEPLOYMENT.md)

Full reasoning behind every choice is in `design.md` §1.

## Getting started

Requires Node 20+ and pnpm.

```bash
pnpm install
```

Create `.env.local` from `.env.example` and fill in:

- `DATABASE_URL`: Supabase Postgres connection string (dev project)
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: dev project server keys
- `AUTH_SECRET`: any long random string for session signing
- `AUTH_TRUST_HOST`: `true` locally, so a production build accepts the request
  host — see [Running a local production build](#running-a-local-production-build)
- `RESEND_API_KEY`: optional locally; email falls back to console
  logging in dev when unset
- `CONTACT_NOTIFY_EMAIL`: the inbox that gets contact-form submissions

Then:

```bash
pnpm db:migrate   # apply the latest Drizzle migration
pnpm db:check     # assert the database has every constraint the migrations declare
pnpm db:seed      # load sample content (required for the site to render)
pnpm dev
```

### Running a local production build

`pnpm dev` treats the request host as trusted; `pnpm build && pnpm start` does
not. Without `AUTH_TRUST_HOST=true`, every `/api/auth/*` endpoint answers 500
with `UntrustedHost`, submitting the login form lands on `/api/auth/error`, and
`/admin/login` looks broken for reasons unrelated to whatever you just changed
(#83). `.env.example` sets the variable; `scripts/deploy-test.sh` exports it for
the same reason, so the smoke test doesn't report a failing login against a
healthy deploy.

It is equally required in production on Render. Vercel set `VERCEL=1` and
Auth.js infers a trusted host from that, which is why the original
deployment notes omitted the variable; Render sets nothing Auth.js recognises,
so without `AUTH_TRUST_HOST=true` every `/api/auth/*` request 500s and
`/admin/login` is broken in production. `render.yaml` and
`.env.production.example` both set it (design.md §8).

One environment-specific database note: Supabase's connection pooler hostname is
unreachable from networks where DNS64 synthesises `AAAA` records with no IPv6
route. It surfaces as `ENETUNREACH` on `64:ff9b::...` from `pnpm db:migrate` or
`pnpm db:check`, which reads like a credentials problem. Pinning the pooler's
IPv4 literal in `DATABASE_URL` works around it.

### Database workflow

Drizzle owns the schema; migrations are applied in sequence and are never
edited after being applied (design.md §8, `AGENTS.md` conventions).

```bash
pnpm db:generate   # generate a migration from schema.ts changes
pnpm db:migrate    # apply pending migrations to DATABASE_URL
pnpm db:check      # fail if the database drifted from the migration files
pnpm db:studio     # browse the dev database
```

`DATABASE_URL` decides which database a command touches: the dev project
locally and in preview deploys, the production project only in production
deploys. There is no separate "apply to prod" command — switching the env
var is the switch (design.md §8).

Run `pnpm db:check` after `pnpm db:migrate`. `db:generate` only diffs
`schema.ts` against the snapshot files, so it happily reports "nothing to
migrate" while the database is missing statements the migration files
declare; `db:check` queries the live catalog and compares it against the
migration files to catch that. See [#60](https://github.com/PeterIregi/piregi-portfolio/issues/60)
for how that drift happened and what it cost.

**Never re-run `db:generate` for a migration that has already been
applied.** `generate` writes a fresh `when` timestamp into
`drizzle/meta/_journal.json`, and drizzle decides what is pending by
comparing the newest `created_at` in `drizzle.__drizzle_migrations` against
that timestamp. Raising a timestamp above the recorded one makes drizzle
re-apply the whole file from the top, which fails on `CREATE TABLE` for a
table that already exists — and the failure surfaces as a bare non-zero exit
with no SQL error, so it reads as a connection problem. A change to an
applied migration belongs in a new one, per design.md §8.

### Supabase projects

Both projects exist, each with the `cv-images` (public) and `cv-files`
(private) storage buckets from design.md §5:

| | Project | Ref |
|---|---|---|
| dev | `piregi-portfolio-dev` | `dahkcmakorkgaxaslhho` |
| production | `piregi-portfolio-prod` | `jjmpltxgwonijnrjjzhd` |

Both are in `us-east-1`. Database passwords are in the Supabase dashboard
and are not committed to this repo. Production keys go into the Render
service's environment (declared in `render.yaml`, prompted for at Blueprint
apply time); nothing secret belongs in `.env.local` beyond the dev project.

### Checks

```bash
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit
pnpm check:contrast   # WCAG 2.1 AA contrast for both colour schemes
pnpm check:classes    # every colour utility resolves to a theme token
pnpm check:storage    # storage bucket round-trip against the live project
```

Three more drive a running app in a browser and are deliberately not in CI,
because every page is `force-dynamic`, reads the database, and design.md §8
keeps `DATABASE_URL` off CI and preview builds:

```bash
BASE=http://localhost:3111 pnpm a11y:check    # keyboard, mobile nav, announcements, axe-core
BASE=http://localhost:3111 pnpm login:check   # where a valid sign-in lands
BASE=http://localhost:3111 node scripts/flows-check.mjs  # media and CV over real HTTP
```

`login:check` signs in as the seeded admin, so it needs a dev database and a
freshly started server: login is rate limited to 5 attempts per email+IP per 15
minutes and the counter lives in the server process (#6).

`check:contrast` needs no database. It reads the `@theme` block out of
`src/app/globals.css` and asserts every foreground/background pair the
components produce clears 4.5:1 for text and 3:1 for control boundaries and
focus rings (WCAG 1.4.3, 1.4.11). It parses the values rather than copying
them, so it fails if a token is renamed instead of silently keeping to test
a colour nothing uses. When a check fails, change the token in
`globals.css`, not the hex value in a component (design.md §10).

`check:classes` needs no database either. Tailwind omits a utility it cannot
resolve, so `bg-typo` compiles to no CSS at all and renders an unstyled
element with no error from the compiler, `eslint`, `tsc`, or `pnpm build`.
This check compiles the project's own `globals.css` with source scanning off,
hands Tailwind every colour utility found in `src/`, and fails on the ones it
declines — which is what a renamed or deleted token looks like from a
component. It shares the `@theme` block with `check:contrast` rather than
copying token names, so the two cannot disagree.

It also rejects Tailwind's stock palette (`text-white`, `bg-black`, and their
opacity variants) in components. Those resolve perfectly and are still wrong,
because they do not flip with the colour scheme: `text-white` on the accent
was 3.36:1 in dark mode (#72). `check:contrast` cannot catch that on its own,
since a component reaching around the tokens is by definition not on its
hand-written pair list.

The two checks answer different questions, and both are needed:
`check:classes` proves a class *comes from the theme and produces* CSS;
`check:contrast` proves the colour it produces is legible in both schemes.

## Project docs

This repo is organized around four documents. Read the one that matches
your question:

- [`prd.md`](./prd.md): what this product does and why, including what's
  explicitly out of scope for now
- [`design.md`](./design.md): architecture, schema, and the reasoning
  behind technical decisions
- [`AGENTS.md`](./AGENTS.md): conventions and ground rules for anyone
  (human or AI) writing code in this repo
- [`WORKFLOW.md`](./WORKFLOW.md): how work is branched, committed, and
  tracked through GitHub issues/milestones

## Status

In active development. Next.js + Drizzle scaffold is in place (issue #1);
schema, auth, and public pages come next. Milestones and issues in
`WORKFLOW.md` §5/§6 are the build plan.