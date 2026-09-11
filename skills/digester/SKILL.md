---
name: digester
description: >
  Turns raw requirements (a file, a URL, or pasted text) into Given/When/Then business rules, in a HUMAN <-> AI
  loop — extracted section by section, each batch confirmed before the next, never invented. Reads a structured
  `digest-style` file for the developer's own extraction process. Writes `business-rules.md`, grouped by input
  section, which the `analyst` skill (or any other reader) can consume as authoritative input. Progress persists
  to `digest-session-<slug>.md` so one digest can span many sessions. Trigger: "/digester", "digest these
  requirements", "extract business rules", "turn this into given/when/then", "resume the digest".
argument-hint: "<input file, URL, or text> [style=<name|path>] [session=<path to digest-session file>]"
---

# digester

Turns prose requirements into Given/When/Then business rules — nothing more. No events, no aggregates, no
bounded contexts; that modelling is `analyst`'s job. `digester` extracts what the input actually says, in small
confirmed batches, and writes it down in a structured, reusable form.

## Why this skill exists

Requirements prose hides its own logic — the same document reads differently to two people because the rules
inside it are implicit. Naming every precondition and outcome as an explicit Given/When/Then statement, and
having the developer confirm each batch, turns that implicit logic into something unambiguous and reusable
downstream — by `analyst`, by `developer`, or by a human reading `business-rules.md` directly.

## The `digest-style` file — the process the tool executes

Named styles live at `~/.claude/digest-styles/<name>.md`. A project may carry its own at
`<project>/.claude/digest-style.md` — a full style, or a thin file with `extends: <name>` plus the entries it
overrides or adds. Same entry format as `coding-style` / `spec-style`: a fenced `~~~entry` YAML block under a
`## <kind>` section, stable `### <id>` anchor. Full format: `digest-style-TEMPLATE.md`.

### Loading a style — do this first, every run

1. **Resolve which style**: `style=<name|path>` on the invocation wins; else the project's
   `<project>/.claude/digest-style.md` if it exists (`extends:` names the base); else the sole file in
   `~/.claude/digest-styles/` if there is exactly one; else list the available styles and ask.
2. **Merge** — if the project file `extends` a base: load the base, then replace any entry whose `id` also
   appears in the project file; base-only entries are kept.
3. **Validate** — every `runs` / `steps` / `uses` / `belongs-to` / `rules` id must resolve. A dangling id stops
   the run with the broken reference named, before any dispatch.
4. **Load safety** — a named or `extends`-ed style file that is not found is a hard error, never a silent skip.
5. **Announce** — one line before any work: resolved style name, `extends` chain if any, files loaded, which
   entry ids the project override replaced.

## `digest-session-<slug>.md` — the state file

One file per digest run, in the working directory. Mirrors `coding-session-<slug>.md` /
`analysis-session-<slug>.md`: input source, the input's sections, per-section extraction status, the checkpoint
log, and `Next`. `session=<path>` overrides the filename. Written in English regardless of conversation language;
kept current in the same turn as the event it records.

## Execution model

1. **Load the style** (resolve, merge, validate, announce).
2. **Dispatch** — match the task to `scenario-digest-input`, run its `preface-steps` then `digest-requirements`.
3. **Open the session file** — create it with the input source and its identified sections, or resume an
   existing one for this input.
4. **Walk the plan**, in order:
   - `read-input` — load the input, split into sections (headings, or natural story/paragraph breaks).
   - `extract-rules` (loop) — for each section, `extract-rules-batch`: pull out the Given/When/Then rules it
     implies, one rule per distinct precondition/outcome pair. Stop at the section's checkpoint before the next.
   - `finalize` — write every confirmed rule to `business-rules.md`, grouped by section, each as its own
     `~~~rule` block. Stop for a closing confirmation.
5. **Finish** — once `digest-requirements.done-when` holds, summarise (n rules across m sections) and set `Next`
   to "nothing — digest complete, ready for analyst or any other reader" (or to whatever the developer flags).

This is entirely sequential — no step benefits from parallel subagents; every step either extracts (needs
judgement, one section at a time) or writes (needs the confirmed rules to already exist).

## Checkpoint protocol

Same protocol as `developer` / `analyst`:

- `type: ask` — put the `prompt` to the developer and wait.
- `type: notify` — inform, don't wait (not used in the current `digest-style.md`, but a step may add one).
- `blocking: true` — do not proceed without an answer. Every checkpoint in `digest-style.md` is currently
  blocking — extraction is judgement-heavy enough that no step is "obviously right, skip confirming".
- `when: <condition>` — only stop if the condition holds.
- `shows: [...]` — render these before asking.
- After the answer: record section + question + answer + resulting rules in the session's checkpoint log.
  "Adjust" means redo the batch's extraction, not carry on with what was wrong.

## Output — `business-rules.md`

Written by `finalize`. One `~~~rule` block per rule, grouped under `## Section: <name>` headings matching the
input's own sections:

~~~rule
id: reservation-confirmed-when-desk-available
section: "Book a desk"
given: Desk is marked available for the requested day
when: Employee requests a reservation for that desk and day
then: ReservationConfirmed
~~~

This file is plain, structured data. `digester` does not know or care who reads it next — `analyst` treats it as
authoritative optional input (see its `SKILL.md`), but nothing here assumes `analyst`, or any other tool, exists.

## Language

- Converse with the developer in their language; match and switch with them.
- `digest-style` files, session files, and `business-rules.md` stay in English.

## Resuming

On invocation with an existing `digest-session-<slug>.md` for this input (or `session=` naming one): read it in
full, state in one or two lines where things stand (which sections are done, which is next), re-announce the
resolved style, and ask whether to resume from the current section or somewhere else.

## Notes

- Never invent a rule not implied by the input. If a section is ambiguous, say so at its checkpoint and ask,
  rather than guessing a plausible-sounding Given/When/Then.
- If the style file fails validation, report the broken reference and ask whether to continue without that
  entry or stop.
- `digester` never references an id from `coding-style` / `developer` / `spec-style` / `analyst`. It must work
  installed entirely on its own.
- One input, one session file. Digesting a second, unrelated document is a new run with its own
  `digest-session-<slug>.md`.
