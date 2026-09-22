---
name: project-scaffolder
description: Reads an existing PRD.md and generates design.md, AGENTS.md, WORKFLOW.md, and a real README.md for the specific project, cross-referenced so the agent knows which file to consult at each step. Use at the start of a new repo that has only PRD.md (plus maybe .gitignore, an empty README, a license) and nothing else yet.
metadata:
  opencode/slash: "true"
---

# Project Scaffolder

## When this applies

Trigger this skill when a repo has:
- a `PRD.md` (the only substantive file — usually the result of the
  builder's own research, written before any code exists), and
- optionally `.gitignore`, an empty or boilerplate `README.md`, and/or a
  `LICENSE`

and is missing `design.md`, `AGENTS.md`, and `WORKFLOW.md`.

Do not run this if `design.md` or `AGENTS.md` already exist and are
populated — that means scaffolding already happened, and regenerating
would overwrite real decisions. If they exist but look like placeholders
(near-empty, clearly boilerplate), ask before overwriting.

## What this produces

Four files, in this order, because each one depends on decisions made in
the one before it:

1. `design.md` — architecture and schema decisions, derived from the PRD
2. `AGENTS.md` — coding ground rules and conventions, derived from
   `design.md`'s decisions
3. `WORKFLOW.md` — git flow, milestones, and issues, derived from the
   PRD's feature list and `design.md`'s build order
4. `README.md` — rewritten from whatever placeholder exists, pointing
   readers (human or AI) to the other three files for depth

Every file gets a short header pointing at the others, in the same
pattern the existing examples use: *"Read this together with X (what),
Y (architecture), Z (process)."* This is not decoration — it's what lets
an agent in a later session know which file answers which kind of
question without re-deriving the answer from scratch.

## Process

### Step 1 — Read the PRD fully before writing anything

Do not start drafting `design.md` from the first paragraph you read.
Read the whole `PRD.md`, including any "non-goals" or "v2 backlog"
section — those sections are load-bearing: they tell you what NOT to
build, which is exactly the kind of over-scoping AI agents default to.

### Step 2 — Fill genuine gaps by asking, not guessing

The PRD describes *what* to build. It usually does not commit to a stack,
a hosting provider, or a schema. Before writing `design.md`, check
whether the PRD already answers these; if not, ask (don't invent
silently, and don't ask about things the PRD already answered):

- Stack / framework, based on what the PRD's requirements actually need
  (not by default — e.g. don't reach for Next.js if the PRD describes a
  Go service with no UI)
- Hosting/deployment target (Vercel, Render, Docker, etc. — match the
  builder's usual choices unless the PRD implies otherwise)
- Database and auth approach
- Payment/notification providers, if the PRD requires them and doesn't
  name one
- Anything the PRD flags as an open decision itself

Keep this to one round of questions covering only real gaps. A PRD that
already specifies the stack needs none of this.

### Step 3 — Generate `design.md`

Use `templates/design.template.md`. Populate every section from the PRD
plus the answers from Step 2. Concretely, this means:

- A schema derived from the PRD's data-bearing user flows — every entity
  a flow reads or writes needs a table/model.
- A folder structure that matches the chosen stack's idioms, not a
  copy-pasted structure from a different framework.
- Explicit security/authorization boundaries wherever the PRD implies
  data that must not be publicly writable or readable (admin dashboards,
  payments, user accounts) — do not leave this implicit.
- Concurrency/idempotency call-outs wherever the PRD implies money,
  inventory, or anything else where a race condition or duplicate event
  would cause real harm. Not every project needs this section — a static
  content site doesn't — so only include what actually applies, don't
  pad it in.
- An explicit "open decisions" section for anything genuinely undecided
  and deferred rather than silently resolved.

Leave out sections the template lists that don't apply to this project
(e.g. no payment abstraction section for a project with no payments).
A design doc padded with irrelevant sections is exactly the kind of AI
slop this skill exists to avoid — see `references/avoid-ai-slop.md`.

### Step 4 — Generate `AGENTS.md`

Use `templates/AGENTS.template.md`. Every "ground rule" in this file
must trace back to a specific decision in `design.md` or a specific
requirement in the PRD — never a generic best practice pasted in because
it sounds professional. If `design.md` has a payment abstraction, `AGENTS.md`
gets a rule against bypassing it, pointing at the exact file path. If
`design.md` has no payments, that rule doesn't exist in this project's
`AGENTS.md`.

Also generate the "Definition of done" checklist by walking `design.md`
section by section and asking "what would make this specific decision
easy to violate by accident?" — that's the checklist item.

### Step 5 — Generate `WORKFLOW.md`

Use `templates/WORKFLOW.template.md`. Derive milestones directly from the
PRD's user flows and `design.md`'s build order (infrastructure and
schema first, then the features that depend on them, matching how the
example project sequences: setup → auth/data foundation → admin/internal
tooling → public-facing → integration/payments → polish and launch).
Derive issues under each milestone from the concrete pieces of work
`design.md` and the PRD imply — one issue per independently completable
piece, not one giant issue per milestone.

Keep the git-flow conventions (branch naming, commit format, PR
description block, closing-keyword rule) consistent across every project
this builder scaffolds — that section of the template should barely
change between projects, since it's a personal convention, not something
that depends on this specific PRD.

### Step 6 — Rewrite `README.md`

Use `templates/README.template.md`. If a boilerplate README already
exists (framework-generated, e.g. `create-next-app`'s default), replace
it entirely rather than appending to it. The README's job is to be the
front door: what this is, how to run it locally, and a pointer to
`PRD.md`/`design.md`/`WORKFLOW.md` for anyone who needs more than the
front door gives them. Keep it simple by default; only go into detail on
setup steps that are genuinely non-obvious (a required env var, a
migration step, a local service dependency) — don't pad it with a
feature list that duplicates the PRD.

### Step 7 — Verify cross-references resolve

After all four files exist, check that:
- `design.md` references the PRD sections it drew from
- `AGENTS.md` references the specific `design.md` sections behind each
  rule, and points at `WORKFLOW.md` for process
- `WORKFLOW.md` references `PRD.md`, `design.md`, and `AGENTS.md`
- `README.md` links to all three

This is what makes the four files function as a system instead of four
disconnected documents — a later inference loop should be able to open
any one of them and immediately know which of the other three to open
next for the kind of question it's answering.

### Step 8 — Apply the slop check before finishing

Read `references/avoid-ai-slop.md` and pass every generated file against
it before presenting the result. This is a required step, not optional
polish — the whole point of this skill is to produce documents that read
like a specific human made specific decisions, not like a template got
filled in.
