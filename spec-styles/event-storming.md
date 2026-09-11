# Spec style — Krzysztof

A structured description of how I turn a requirements input into task specs, meant to be read and executed by an
AI tool.

## How a tool loads this

- Named styles live at `~/.claude/spec-styles/<name>.md`; a project may add its own at
  `<project>/.claude/spec-style.md` (a full style, or `extends: <name>` + overriding entries).
- Selection: `style=<name|path>` arg > project file > the sole global style > ask.
- With `extends`, a project entry overrides the base entry of the same `id`; base-only entries are inherited.
- Validate every `runs` / `steps` / `uses` / `belongs-to` / `rules` id after merge, before dispatch.
- This file is always English. The tool speaks my language; the file stays English.

## Format

Same entry format as `coding-style` (see `coding-style-TEMPLATE.md`): a fenced `~~~entry` YAML block per entry,
`###` heading for navigation only, no prose outside the block.

One addition to `checkpoint.type`:

- `type: ask` — stop and wait for an answer.
- `type: notify` — inform the developer of what was derived; do not wait. Used for steps that are mechanically
  derived from already-confirmed data, where a hard stop would be noise.

Two clarifications carried over from `coding-style.md` (not yet backported into `coding-style-TEMPLATE.md` —
see `analyst-progress.md` open items): `belongs-to` may be a list when a step is reused across procedures, and
an `applies-during` entry may name a `procedure` or `loop` id, meaning "every step inside it".

**analyst never references an id from `coding-style` / `developer`.** It must work fully standalone, whether or
not any other skill is installed. Cross-tool hints (e.g. `shape` on a spec) use a tool-agnostic vocabulary, never
another tool's internal ids.

---

## Scenarios

### scenario-analyze-input

~~~entry
id: scenario-analyze-input
kind: scenario
title: Analyze a requirements input into task specs
description: >
  Takes the raw requirements input and, if present, a business-rules.md (from the digester skill, or written by
  hand) with Given/When/Then rules already extracted. The rules file is optional — analyst runs standalone on
  raw input alone — but when present it is authoritative input alongside the raw text, not a suggestion to
  re-derive from scratch.
match: task is to turn a requirements document, URL, or description into a set of spec files
preface-steps: [ingest]
runs: requirements-analysis
~~~

---

## Procedures

### event-storming

~~~entry
id: event-storming
kind: procedure
title: Event storming from a requirements input
description: >
  Big Picture event storming run against the input document. Breadth-first: collect everything before judging
  any of it. Produces the building blocks a use case needs.
steps: [collect-events, attach-event-rules, identify-aggregates, derive-commands, derive-views, derive-use-cases,
        draw-bounded-contexts]
done-when: events, their rules, aggregates, commands, views, use cases and bounded contexts are all confirmed
~~~

### requirements-analysis

~~~entry
id: requirements-analysis
kind: procedure
title: Requirements analysis loop
description: >
  Turns a requirements input into reviewed, written spec files — event storming for the analysis itself, then
  one spec per accepted candidate.
steps: [restate-understanding, event-storming, propose-candidate-specs, detail-spec, collect-open-questions, finalize]
done-when: >
  every accepted candidate has a spec file, every blocking open question is resolved or left explicitly
  status: blocked, and specs/README.md is current
~~~

---

## Heuristics

### classify-task-shape

~~~entry
id: classify-task-shape
kind: heuristic
title: Classify the shape of a candidate task
description: >
  A tool-agnostic hint carried in the spec's `shape` field. analyst does not assume any downstream tool exists —
  it names the kind of change, not a scenario id belonging to something else. If a tool like the developer skill
  is also installed, map these shapes to its own scenarios yourself: new-module -> bootstrap-style scenario,
  new-behaviour -> add-use-case-style scenario, change-behaviour -> modify-existing-code-style scenario,
  coverage-only -> backfill-tests-style scenario.
rules:
  - if: the use case's bounded context is not yet an existing module
    then: new-module
  - if: the use case is new behaviour in a module that already exists
    then: new-behaviour
  - if: the use case changes behaviour of existing, tested code
    then: change-behaviour
  - if: the task is purely adding missing test coverage, no behaviour change
    then: coverage-only
~~~

---

## Rules

### one-task-granularity

~~~entry
id: one-task-granularity
kind: rule
title: One spec is one thing a single /developer run can finish
must:
  - a spec covers one coherent change; if it needs its own architecture decision or spans bounded contexts, split it
  - merging use cases into one spec is proposed explicitly at propose-candidate-specs — never silent
example: >
  two small use cases on the same aggregate (assign-role / revoke-role) may merge into one spec; a use case
  touching two bounded contexts must split into two.
~~~

---

## Rulesets

### spec-rules

~~~entry
id: spec-rules
kind: ruleset
title: How a spec is written
description: >
  Keeps specs sharp enough for /developer to act on without re-asking what "done" means.
rules: [acceptance-criteria-format, definition-of-done, no-invented-requirements, dependencies-explicit]
applies-during: [detail-spec]
~~~

### acceptance-criteria-format

~~~entry
id: acceptance-criteria-format
kind: rule
belongs-to: spec-rules
title: Acceptance criteria are the Given/When/Then rules, carried through
description: >
  Same philosophy as test-naming in coding-style — state behaviour in the product owner's language, not
  implementation. A checklist, not prose. When the event(s) backing this spec have digested Given/When/Then
  rules attached, each criterion is that rule verbatim — not paraphrased or rewritten. Only write a fresh
  criterion when no digested rule covers the case.
must:
  - each criterion is one observable, checkable statement, in Given/When/Then form where a rule exists for it
  - criteria describe behaviour/outcome, not implementation steps
  - a criterion sourced from a digested rule is copied as-is, so it reads the same in business-rules.md and in
    the spec
example: |
  - [ ] Given desk is marked available for the requested day, when employee requests a reservation, then
        ReservationConfirmed
  - [ ] Given desk is already reserved for the requested day, when employee requests a reservation, then
        ReservationRejected
~~~

### definition-of-done

~~~entry
id: definition-of-done
kind: rule
belongs-to: spec-rules
title: What "done" means unless a spec says otherwise
description: >
  Mirrors, in spirit, what a coding-style procedure calls done-when — stated independently here since specs and
  code-style are separate, independently-loaded files.
default:
  - all acceptance criteria are covered by passing tests
  - production code is refactored, not just made to pass
  - the change is committed
override: a spec may state extra done-criteria explicitly (e.g. "and the migration is applied in staging")
~~~

### no-invented-requirements

~~~entry
id: no-invented-requirements
kind: rule
belongs-to: spec-rules
title: Unknowns go to Open questions, never guessed
must:
  - never fabricate a business rule, a value, or a constraint not present in the input or confirmed by the developer
  - an unresolved unknown blocking the spec sets status: blocked and lists the question under Open questions
~~~

### dependencies-explicit

~~~entry
id: dependencies-explicit
kind: rule
belongs-to: spec-rules
title: State ordering dependencies between specs
must:
  - if spec B needs spec A done first, B's depends-on lists A's id
  - never rely on file order or numbering alone to imply a dependency
~~~

---

## Loops

### attach-event-rules

~~~entry
id: attach-event-rules
kind: loop
belongs-to: event-storming
title: Attach the rules that must hold for each event
description: >
  Each event gets the precondition phrases that must be true for it to fire. When digested Given/When/Then rules
  are available, this is mostly confirmation — attach the rule(s) whose `then` produced this event, using their
  `given` as the preconditions — rather than inventing from scratch. Without digested rules, write short
  precondition phrases directly: sticky notes above the event card, not a full sentence (e.g. "Resource is
  available", "User has role ADMIN"). Processed in small batches; each batch stops for confirmation.
steps: [attach-rules-batch]
until: every event has its rules attached and confirmed
~~~

### detail-spec

~~~entry
id: detail-spec
kind: loop
belongs-to: requirements-analysis
title: Draft each accepted candidate spec
steps: [draft-spec]
until: every accepted candidate has a reviewed, written spec file
~~~

---

## Steps

### collect-events

~~~entry
id: collect-events
kind: step
belongs-to: event-storming
title: Collect every domain event, Big Picture style
description: >
  Read the input end to end — the raw text and, where present, the digested Given/When/Then rules together — and
  list every domain event: a significant, past-tense, domain-language change in the system. When rules are
  present, their `then` clauses are strong candidates, but this is still a judgement call, not a mechanical copy
  — merge duplicates, and don't promote a trivial rule outcome to event status. Rough chronological order,
  breadth-first — capture everything before judging it.
produces: an ordered list of domain events
checkpoint:
  type: ask
  blocking: true
  prompt: "Events found, in order: <list>. Complete? Right names, right order?"
~~~

### attach-rules-batch

~~~entry
id: attach-rules-batch
kind: step
belongs-to: attach-event-rules
title: Attach rules for a batch of events
description: >
  For a small batch of events, attach the digested rule(s) that produced each (or write the precondition
  phrases directly, if no digested rules exist). Stop and confirm before the next batch.
produces: precondition phrases (or attached rule ids) for the events in this batch
checkpoint:
  type: ask
  blocking: true
  prompt: "Rules attached — <event>: <phrases>; … Continue to the next batch, or adjust?"
~~~

### identify-aggregates

~~~entry
id: identify-aggregates
kind: step
belongs-to: event-storming
title: Group events under the aggregate that owns them
description: >
  Group events (with their rules) under the aggregate responsible for them, and draw the aggregate boundary.
produces: aggregates, each with its owned events and rules
checkpoint:
  type: ask
  blocking: true
  prompt: "Aggregates: <name -> events>. Boundaries right?"
~~~

### derive-commands

~~~entry
id: derive-commands
kind: step
belongs-to: event-storming
title: Derive the command that triggers each event
produces: one command per event, attached to its aggregate
checkpoint:
  type: notify
  prompt: "Commands derived: <command -> event>; …"
~~~

### derive-views

~~~entry
id: derive-views
kind: step
belongs-to: event-storming
title: Derive the read models the use cases will need
produces: a list of views/read models
checkpoint:
  type: notify
  prompt: "Views derived: <list>."
~~~

### derive-use-cases

~~~entry
id: derive-use-cases
kind: step
belongs-to: event-storming
title: Derive use cases from command + aggregate + event
description: >
  Each command/aggregate/event triple that represents one coherent operation becomes a candidate use case — the
  seed for a spec (default 1:1, mergeable at review).
produces: a list of candidate use cases
checkpoint:
  type: notify
  prompt: "Use cases derived: <list>."
~~~

### draw-bounded-contexts

~~~entry
id: draw-bounded-contexts
kind: step
belongs-to: event-storming
title: Draw bounded contexts and how they communicate
produces: bounded contexts, each with its aggregates and communication style (events / sync)
checkpoint:
  type: ask
  blocking: true
  prompt: "Bounded contexts: <list + communication style>. Confirm before moving to specs?"
~~~

### propose-candidate-specs

~~~entry
id: propose-candidate-specs
kind: step
belongs-to: requirements-analysis
title: Turn use cases into a candidate spec list
description: >
  From the confirmed use cases (and any new-module bootstrap needs surfaced by bounded contexts), propose one
  candidate spec title per task. Small, tightly-coupled use cases on the same aggregate may be proposed as one
  merged candidate — never merged silently.
uses: [one-task-granularity, classify-task-shape]
produces: an ordered list of candidate spec titles, each tagged with its source use case(s) and a task shape
checkpoint:
  type: ask
  blocking: true
  prompt: "Candidate specs: <list, proposed merges marked>. Add, drop, merge, or split?"
~~~

### ingest

~~~entry
id: ingest
kind: step
title: Read the input
description: >
  Load the requirements input — a local .md file, a URL (fetched), or inline text given with the invocation.
  Also look for a business-rules.md (path given explicitly, or sitting next to the input) — if present, load it
  too; its Given/When/Then rules are authoritative input for the rest of the loop, not something to re-derive.
produces: >
  the raw input text, plus the digested rules if a business-rules.md was found, with sources recorded for the
  session file
~~~

### restate-understanding

~~~entry
id: restate-understanding
kind: step
belongs-to: requirements-analysis
title: Restate what needs to be done
description: >
  Summarise, in the product owner's language, what the input is asking for, before running any analysis.
checkpoint:
  type: ask
  blocking: true
  prompt: "Here's what I understand needs doing: <summary>. Correct?"
~~~

### draft-spec

~~~entry
id: draft-spec
kind: step
belongs-to: detail-spec
title: Draft one spec
description: >
  Write Context / Acceptance criteria / Out of scope / Open questions for one candidate, applying spec-rules.
uses: spec-rules
produces: a spec file in specs/, not yet final
checkpoint:
  type: ask
  blocking: true
  prompt: "Spec <n> <title>: <scope + acceptance criteria as drafted>. Change anything?"
~~~

### collect-open-questions

~~~entry
id: collect-open-questions
kind: step
belongs-to: requirements-analysis
title: Surface every unresolved open question
description: >
  Gather Open questions across all drafted specs and present them together, rather than leaving them hidden
  inside individual files. An answer folds back into the relevant spec and clears its status: blocked if that was
  the only blocker.
checkpoint:
  type: ask
  blocking: true
  prompt: "Open questions across all specs: <list>. Any you can resolve now?"
~~~

### finalize

~~~entry
id: finalize
kind: step
belongs-to: requirements-analysis
title: Write the specs and close the run
description: >
  Ensure every spec file is saved, write or update specs/README.md as an index (id, title, status, shape),
  summarise, and set the session's Next.
shows: [file-list]
checkpoint:
  type: ask
  blocking: true
  prompt: "Analysis done: <n> specs written to specs/. Anything to add before we stop?"
~~~
