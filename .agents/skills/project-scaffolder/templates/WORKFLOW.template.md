# WORKFLOW.md — Git flow, milestones, and issues

**Read this file before making any change, and again before committing or
pushing.** It defines how work is branched, committed, and closed out in
this repo. It complements `PRD.md` (what to build), `design.md`
(architecture), and `AGENTS.md` (coding conventions) — this file governs
process, not code.

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
  issue, open a new issue and a new branch — don't scope-creep one branch.

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

`<scope>` is the affected area — match folder/domain names from
`design.md` where possible.

Rules:
- One logical change per commit.
- Every commit for an issue includes that issue's number, even across
  multiple commits, so commits can be grouped by issue later.
- Summary in the imperative mood ("add," not "added"/"adds").
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

## 4. Before committing/pushing — checklist

- [ ] Branch name matches `<type>/<issue-number>-<short-slug>`.
- [ ] Every commit message follows the format in §2.
- [ ] Commits are grouped and listed chronologically for review.
- [ ] The PR description block (§3) is generated and ready to paste.
- [ ] The relevant `AGENTS.md` "Definition of done" items pass for
      anything the issue touched.

---

## 5. Milestones

Derive from the PRD's user flows and `design.md`'s build order. The
sequence below is the usual shape — infrastructure and data foundation
first, then the features that depend on them, then integration/launch —
but the actual milestone names and count should match this project, not
be copied verbatim. Delete/merge/add milestones as the PRD requires.

### Milestone 1: Project Setup & Infrastructure
Repo, environments, and deployment pipeline in place. Nothing
user-facing yet.

### Milestone 2: {{Data/Auth Foundation, named for this project}}
{{Schema applied, access control working — whatever design.md §{{n}}
establishes as the foundation everything else depends on.}}

### Milestone 3+: {{One per major feature area from the PRD}}
{{Name each after the actual feature area — don't keep generic
placeholder names in the final file.}}

### Final milestone: Polish, QA & Launch
{{Whatever this project's specific pre-launch checks are — responsiveness,
performance, a specific security re-verification, production deploy and
smoke test.}}

---

## 6. Issues

> Issue numbers match the live issues in GitHub; list each milestone's
> issues in ascending number order. Every commit references the number of
> the issue it belongs to.

For each milestone, list issues as:

**#N — Short imperative title**
One to three sentences describing the concrete, independently completable
piece of work, referencing the exact `design.md` section or PRD flow it
implements. Avoid vague issues like "build the dashboard" — break it into
the actual independently-completable pieces (e.g. "build the create form,"
"build the list view," "build image upload") the way real feature work
gets sequenced.
