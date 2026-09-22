# Avoiding AI slop in generated docs

Run every generated file (`design.md`, `AGENTS.md`, `WORKFLOW.md`,
`README.md`) against this list before presenting it. Fix violations by
rewriting the sentence, not by softening the wording.

## Banned punctuation habit

**No em dashes (—) used as a substitute for a period, comma, or
parenthesis.** This is the single most identifiable AI tell. Split the
sentence into two, or use a comma, instead.

- Bad: `Promotions are rows, not code — this keeps pricing logic in one
  place.`
- Good: `Promotions are rows, not code. This keeps pricing logic in one
  place.`

A hyphen inside a compound word (`single-vendor`, `server-only`) is fine.
An em dash joining two clauses is not.

## Banned phrases and patterns

- **Empty transition padding**: "It's important to note that," "In
  today's fast-paced [industry]," "When it comes to X," "At the end of
  the day." Delete these — they add words, not meaning.
- **The "not just X, it's Y" construction**: "This isn't just a database,
  it's the backbone of the application." State the actual thing plainly.
- **Corporate-speak verbs used as filler**: "leverage," "seamless,"
  "robust," "streamline," "elevate," "empower" — used where a plain verb
  (use, works reliably, simplify) would say the same thing with less
  noise.
- **Throat-clearing conclusions**: "In conclusion," "To summarize," "All
  in all." A doc section ends when it's done; it doesn't need to announce
  that it's ending.
- **Padded lists**: three generic bullet points where one specific
  sentence would do. If a bullet doesn't name a real file, table, decision,
  or number specific to this project, cut it.
- **Hedging that isn't a real decision**: "This could potentially be
  implemented using..." Either the design doc decides something or it
  explicitly flags it as an open decision in the open-decisions section.
  Don't hedge in the middle of a section that's supposed to be settled.
- **Restating the section heading in the first sentence**: "Database
  Schema. This section describes the database schema." Start with actual
  content.

## Positive checks (what good looks like)

- Every claim in `design.md` and `AGENTS.md` should be traceable: to a
  PRD requirement, a specific file path, or a specific table/column. If a
  sentence would be equally true of any project in this stack, it's
  generic filler — replace it with the project-specific version or cut it.
- Prefer a concrete example over an abstract description. The existing
  ecommerce `AGENTS.md`'s rule about the payment abstraction names the
  exact file (`src/lib/payments/`) rather than saying "use proper
  abstraction layers."
- Numbers and names beat adjectives. "Three separate Supabase
  environments (dev/staging/production)" beats "a robust multi-environment
  setup."
- Read each generated file out loud once, mentally. If a sentence sounds
  like it was written to sound impressive rather than to tell the next
  reader something they need to know, rewrite it.
