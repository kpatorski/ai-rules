# Digest style — Krzysztof

A structured description of how I turn raw requirements into Given/When/Then business rules, meant to be read and
executed by an AI tool.

## How a tool loads this

- Named styles live at `~/.claude/digest-styles/<name>.md`; a project may add its own at
  `<project>/.claude/digest-style.md` (a full style, or `extends: <name>` + overriding entries).
- Selection: `style=<name|path>` arg > project file > the sole global style > ask.
- With `extends`, a project entry overrides the base entry of the same `id`; base-only entries are inherited.
- Validate every `runs` / `steps` / `uses` / `belongs-to` / `rules` id after merge, before dispatch.
- This file is always English. The tool speaks my language; the file stays English.

## Format

Same entry format as `coding-style` / `spec-style` (see `coding-style-TEMPLATE.md`): a fenced `~~~entry` YAML
block per entry, `###` heading for navigation only, no prose outside the block. Uses the same `checkpoint.type:
ask | notify` vocabulary as `spec-style.md`.

**digester never references an id from `coding-style` / `developer` / `spec-style` / `analyst`.** It must work
fully standalone. Its output (`business-rules.md`) is plain, structured data that any downstream reader — human
or another skill — can consume without digester knowing that reader exists.

---

## Scenarios

### scenario-digest-input

~~~entry
id: scenario-digest-input
kind: scenario
title: Digest a requirements input into business rules
match: task is to turn a requirements document, URL, or description into Given/When/Then business rules
preface-steps: [read-input]
runs: digest-requirements
~~~

---

## Procedures

### digest-requirements

~~~entry
id: digest-requirements
kind: procedure
title: Digest raw requirements into Given/When/Then business rules
description: >
  Reads the raw input and extracts the business rules it implies, as Given/When/Then statements, grouped by the
  section/story fragment they came from. No domain modelling here — no events, aggregates, or contexts; that is
  a downstream concern. Purely: prose in, structured rules out.
steps: [extract-rules, finalize]
done-when: every section has its rules extracted and confirmed, and the rules file is written
~~~

---

## Loops

### extract-rules

~~~entry
id: extract-rules
kind: loop
belongs-to: digest-requirements
title: Extract rules section by section
steps: [extract-rules-batch]
until: every section of the input has its rules extracted and confirmed
~~~

---

## Steps

### read-input

~~~entry
id: read-input
kind: step
title: Read the input
description: >
  Load the requirements input — a local .md file, a URL (fetched), or inline text given with the invocation.
  Identify its sections (headings, or natural paragraph/story breaks) — these drive the extraction batches.
produces: raw input text, split into sections
~~~

### extract-rules-batch

~~~entry
id: extract-rules-batch
kind: step
belongs-to: extract-rules
title: Extract GWT rules for one section
description: >
  For one section/story fragment, extract the business rules it implies as Given/When/Then statements — one rule
  per distinct precondition/outcome pair. Stop and confirm before the next section.
produces: GWT rules for this section
checkpoint:
  type: ask
  blocking: true
  prompt: "Section <n> <title> — rules extracted: <list>. Complete? Right phrasing?"
~~~

### finalize

~~~entry
id: finalize
kind: step
belongs-to: digest-requirements
title: Write the rules file
description: >
  Write all confirmed rules to business-rules.md, grouped by section, each rule as its own structured block —
  ready for any downstream reader (a human, the analyst skill, or anything else) to consume.
produces: business-rules.md
checkpoint:
  type: ask
  blocking: true
  prompt: "Digest done: <n> rules across <m> sections, written to business-rules.md. Anything to fix?"
~~~

---

## Output format

One rule, as it is written into `business-rules.md`, grouped under a `## Section: <name>` heading:

~~~rule
id: reservation-confirmed-when-desk-available
section: "Book a desk"
given: Desk is marked available for the requested day
when: Employee requests a reservation for that desk and day
then: ReservationConfirmed
~~~
