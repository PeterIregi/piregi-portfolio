# {{PROJECT_NAME}}

One or two sentences: what this is and who it's for. Pull this straight
from `PRD.md` §1 — don't rewrite it into vaguer marketing language.

## Stack

Short list, not a table — link to `design.md` §1 for the full reasoning.

- {{Framework}}
- {{Database/hosting}}
- {{Anything else worth naming up front}}

## Getting started

Only include steps that are genuinely non-obvious for this project.
Skip generic steps ("clone the repo") unless there's something
project-specific about them.

```bash
{{install command}}
{{env setup — name the actual required env vars, don't say "see .env.example" without also listing what's in it}}
{{run command}}
```

{{Any required local service, migration step, or seed step — name it
specifically.}}

## Project docs

This repo is organized around four documents. Read the one that matches
your question:

- [`PRD.md`](./PRD.md) — what this product does and why, including what's
  explicitly out of scope for now
- [`design.md`](./design.md) — architecture, schema, and the reasoning
  behind technical decisions
- [`AGENTS.md`](./AGENTS.md) — conventions and ground rules for anyone
  (human or AI) writing code in this repo
- [`WORKFLOW.md`](./WORKFLOW.md) — how work is branched, committed, and
  tracked through GitHub issues/milestones

## Status

One line on where this project actually is right now (e.g. "in active
development, pre-launch" or "v1 shipped, v2 backlog in PRD.md §{{n}}").
Update this as the project moves, don't leave it stale.

{{License section only if a LICENSE file exists in the repo.}}
