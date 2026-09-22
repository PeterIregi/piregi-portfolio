# Design Document — {{PROJECT_NAME}}

This document records the architecture and schema decisions for this
project. It exists so both humans and AI agents building on this repo
make consistent choices instead of re-deriving architecture per feature.
Read it together with `PRD.md` (what to build) and `AGENTS.md` (coding
conventions derived from these decisions).

## 1. Stack

Table of layer → choice → why, one row per real decision. Only include
rows for things this project actually has (e.g. no "Payments" row if the
PRD has no payments).

| Layer | Choice | Why |
|---|---|---|
| Framework | {{...}} | {{tie to a specific PRD requirement}} |
| Hosting | {{...}} | {{...}} |
| Database/Auth/Storage | {{...}} | {{...}} |
| Styling | {{...}} | {{...}} |
| Validation | {{...}} | {{...}} |

## 2. Data model / schema (v1)

Derive every table/model from the PRD's user flows: if a flow reads or
writes something, it needs an entity here. Use the target stack's actual
schema language (SQL DDL, Prisma schema, Go structs, etc.) rather than a
generic pseudo-schema.

```
{{schema here, in the real language of the chosen stack}}
```

Note anything intentionally deferred (a nullable/unused column reserved
for a v2 feature the PRD lists in its backlog) and say which PRD section
it's reserved for.

## 3. Core business logic

For each piece of logic that must not be duplicated or reimplemented
inconsistently (pricing, permissions, a state machine, anything with a
"the whole app must agree on this number/state" property): name the
single function/module that owns it and where it lives. Only include this
section if such logic exists — most CRUD-only projects won't need it.

## 4. Authorization / access control

Only include if the project has more than one trust level (public vs
admin, free vs paid, owner vs guest). For each resource, state who can
read and who can write, and where that's enforced (database-level RLS,
middleware, application-level check). State explicitly that "the frontend
won't show it" is never the enforcement mechanism.

## 5. External integrations

One subsection per external service the PRD requires (payments, SMS/email,
maps, etc.). For each: the abstraction interface (if the provider might
be swapped later) and which file owns provider-specific code, so the rest
of the app never imports a provider SDK directly.

## 6. File/module structure

The actual folder tree for the chosen stack, annotated with what belongs
in each folder and, critically, what does NOT belong there (e.g. "API
routes only for X and Y; everything else uses server actions/handlers").

## 7. Concurrency & idempotency

Only include if the PRD involves money, inventory, or any other resource
where two simultaneous operations could both "succeed" incorrectly, or
where an external event (webhook, callback) might be delivered more than
once. For each such case: the specific failure mode and the specific
mechanism (atomic conditional update, idempotency key check) that
prevents it. Skip this section entirely for projects without this risk.

## 8. Environments

How many environments (dev/staging/production or fewer), what's separate
between them (database, API keys), and any rule about never pointing one
environment's deploy at another's data store.

## 9. Observability

What gets monitored (error tracking, specific handlers that must not fail
silently) and what gets tested, if the PRD or the risk profile of this
project (money, security-sensitive data) calls for it. Skip generic
"add tests" filler — name the specific thing that's worth testing because
a silent bug there is costly, if such a thing exists.

## 10. Frontend/UX principles (if applicable)

Only for projects with a user-facing UI. State real constraints (brand
inputs required before UI work starts, specific patterns to avoid) rather
than generic "make it look nice" guidance. If avoiding templated
AI-design patterns matters for this project (client-facing, brand-
sensitive work), name the specific patterns to avoid — flat palette
clichés, arrow-suffixed buttons, numbered markers on non-sequential
content, uniform fade-in animation on every element.

## 11. Legal & compliance (if applicable)

Only if the project collects personal data, handles payments, or operates
in a regulated space. Name the actual applicable regulation and what it
requires (e.g. a specific data protection act, PCI implications of a
payment flow).

## 12. Open decisions

Anything genuinely undecided, explicitly deferred rather than silently
resolved by whoever writes the first line of code that touches it.
