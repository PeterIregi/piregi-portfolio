# Instructions for AI agents building this repo

Read this together with `PRD.md` (what to build), `design.md`
(architecture/schema decisions already made), and `WORKFLOW.md` (git
flow, milestones, and issues). Don't re-derive architecture that's
already decided in `design.md` — follow it, and if a decision there looks
wrong, say so explicitly rather than silently diverging.

**Before making any change, and again before committing or pushing, read
`WORKFLOW.md`.** It defines branch naming, commit message format, how to
group commits by issue, and the PR description block to produce once an
issue's work is ready to push. Every commit in this repo references the
GitHub issue it belongs to, per that file's format.

## Ground rules

List one rule per real constraint from `design.md` — not generic best
practices. Each rule should name the specific file, table, or function it
governs, and cite the `design.md` section it comes from. Example shapes
(replace with this project's actual rules, delete any that don't apply):

1. **Don't invent new architecture for a solved problem.** If `design.md`
   already specifies a schema, folder, or interface, use it. If a
   requirement isn't covered by `design.md` or `PRD.md`, flag the gap
   instead of quietly deciding on your own convention.
2. **{{Rule tied to a specific abstraction, e.g. a payment or provider
   interface — name the exact file path}}** (see `design.md` §{{n}}).
3. **{{Rule tied to an authorization boundary — name the exact
   admin-only file/client that must never be imported into public
   code}}** (see `design.md` §{{n}}).
4. **{{Rule tied to any single-source-of-truth logic, e.g. pricing,
   permissions}}** — don't reimplement it in multiple places.
5. **{{Rule tied to any security requirement that must ship with every
   change to a specific kind of resource, e.g. "every new table needs its
   access policy in the same migration that creates it"}}**.
6. **{{Rule tied to explicit v1 scope limits from the PRD's non-goals —
   name the specific feature not to build and the specific schema field
   left unused for it}}**.
7. **{{Rule tied to any concurrency/idempotency requirement from
   `design.md` §7, if that section exists}}**.
8. **{{Rule tied to cache invalidation or similar, if applicable}}**.

## Conventions

- **Language**: {{language + strict/lint settings for this stack}}.
- **Validation**: {{where shared validation schemas live and the rule
  that a shape is validated once and reused, not redefined per form/
  endpoint}}.
- **Naming**: {{naming convention per layer — db columns, variables,
  types/components}}.
- **File placement**: match `design.md` §{{n}}. {{Any specific rule about
  where certain kinds of logic must/must not live}}.
- **Migrations** (if applicable): {{numbering convention, and the rule
  that an applied migration is never edited, only superseded}}.
- **Error handling**: {{what real users/operators of this system need to
  see instead of generic error messages, especially in any admin-facing
  or operator-facing surface}}.
- **Comments**: explain *why*, not *what*, especially around whichever
  logic in this project is easiest to break without realizing it (name
  it specifically, based on `design.md`).

## Definition of done for a feature

Derive each item by walking `design.md` section by section and asking
"what's the easiest way to violate this decision by accident?" — that
becomes a checklist item. Delete generic items that don't map to an
actual `design.md` decision.

- [ ] {{item tied to design.md §n}}
- [ ] {{item tied to design.md §n}}
- [ ] {{item tied to design.md §n}}

## What NOT to do

Mirror the PRD's non-goals and any abstraction from `design.md` that's
easy to bypass "just this once." Name the specific shortcut and why it's
not acceptable, e.g.:

- Don't add a second integration path that bypasses {{the named
  abstraction}} "for now" — extend it instead.
- Don't build {{a feature explicitly deferred in `PRD.md` §{{n}}}} in v1.
- Don't hardcode {{something that design.md defines as data, not code}}
  in a component.
