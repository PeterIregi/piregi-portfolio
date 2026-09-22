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
- Deployed on Vercel; dev + production Supabase projects

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
- `RESEND_API_KEY`: optional locally; email falls back to console
  logging in dev when unset
- `CONTACT_NOTIFY_EMAIL`: the inbox that gets contact-form submissions

Then:

```bash
pnpm db:migrate   # apply the latest Drizzle migration
pnpm db:seed      # load sample content (required for the site to render)
pnpm dev
```

Create the production Supabase project and its `cv-images` /
`cv-files` storage buckets before the first Vercel production deploy
(design.md §8).

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