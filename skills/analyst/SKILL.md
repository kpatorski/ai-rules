---
name: analyst
description: >
  Turns a requirements input into reviewed, written task specs, in a HUMAN <-> AI loop instead of one large
  generated backlog. Reads a structured `spec-style` file (the developer's own event-storming and decomposition
  process), runs event storming against the input — optionally informed by a digester-produced
  `business-rules.md` of Given/When/Then rules — and derives events, aggregates, commands, views, use cases and
  bounded contexts, stopping at every checkpoint. Turns the accepted use cases into `specs/NNN-slug.md` files
  whose acceptance criteria carry the underlying business rules verbatim, ready for a tool like `developer` (or
  a human) to pick up. Progress persists to `analysis-session-<slug>.md` under `.claude/sessions/` in the
  project. Trigger: "/analyst", "analyze these requirements", "run event storming on this", "turn this into
  specs", "resume the analysis".
argument-hint: "<input file, URL, or text> [rules=<path to business-rules.md>] [style=<name|path>] [session=<path>]"
---

# analyst

Turns a requirements input into task specs by running event storming — the developer's own DDD process — in
small, checkpoint-gated moves. It does not hand back a finished backlog in one shot; every building block
(events, aggregates, bounded contexts, then each spec) is confirmed before the next is built on top of it.

## Why this skill exists

A requirements document does not arrive pre-sliced into tasks. Slicing it well — the right aggregates, the right
task granularity, acceptance criteria that actually mean something — is analytical work with real judgement
calls, not a mechanical transform. This skill keeps a human in that judgement loop instead of guessing alone,
and keeps the output structured enough that a downstream tool can act on it without re-asking what was meant.

## Input

- The raw requirements: a local `.md` file, a URL (fetched), or inline text given with the invocation.
- Optionally, a `business-rules.md` (from the `digester` skill, or written by hand, or named with `rules=`) —
  Given/When/Then rules already extracted. **Authoritative when present** — analyst does not re-derive rules a
  digest already settled, but it also runs perfectly well standalone on raw input alone.

## The `spec-style` file — the process the tool executes

Named styles live at `~/.claude/spec-styles/<name>.md`. A project may carry its own at
`<project>/.claude/spec-style.md` — full, or `extends: <name>` plus overrides. Same entry format as
`coding-style` / `digest-style`: fenced `~~~entry` YAML blocks, `### <id>` anchors, `## <kind>` sections. Full
format and how to write your own: `spec-style-TEMPLATE.md`.

### Loading a style — do this first, every run

1. **Resolve which style**: `style=<name|path>` arg > project's `<project>/.claude/spec-style.md`
   (`extends:` names the base) > the sole file in `~/.claude/spec-styles/` if there is exactly one > list and
   ask.
2. **Merge** — project entries replace base entries of the same `id` under `extends`; base-only entries are
   kept.
3. **Validate** — every `runs` / `steps` / `uses` / `belongs-to` / `rules` id must resolve (`applies-during: any`
   and procedure/loop ids in `applies-during` are valid). A dangling id stops the run before any dispatch.
4. **Load safety** — a named or `extends`-ed style file that is not found is a hard error.
5. **Announce** — one line: resolved style, `extends` chain, files loaded, overridden entry ids.

## `analysis-session-<slug>.md` — the state file

One file per analysis run, under `.claude/sessions/` in the project (i.e.
`.claude/sessions/analysis-session-<slug>.md`) — not the project root, so it never clutters `git status`. Holds:
input source(s) (raw + rules file if any), `restate-understanding`'s confirmed summary, the event-storming
building blocks as they're confirmed (events, their rules, aggregates, commands, views, use cases, bounded
contexts), the candidate spec list, per-spec draft status, the open-questions log, and `Next`. Mirrors
`coding-session-<slug>.md` / `digest-session-<slug>.md`. `session=<path>` overrides the location entirely.
English regardless of conversation language; kept current turn by turn.

**First use in a project:** check whether `.claude/sessions/` is covered by `.gitignore`. If not, say so and
offer to add a `.claude/sessions/` line.

## Execution model

1. **Load the style.**
2. **Dispatch** — match `scenario-analyze-input`, run its `preface-steps` (`ingest`) then `requirements-analysis`.
3. **Open the session file.**
4. **Walk the plan**, in order:
   - `restate-understanding` — summarise what's being asked; blocking checkpoint.
   - `event-storming` — the full sub-procedure: `collect-events`, `attach-event-rules` (batched loop),
     `identify-aggregates`, `derive-commands`, `derive-views`, `derive-use-cases`, `draw-bounded-contexts`. Each
     step's own checkpoint (`ask`/`notify`) applies. If `business-rules.md` was loaded, its rules are
     authoritative input throughout — attach them to the events they produced rather than re-deriving.
   - `propose-candidate-specs` — turn confirmed use cases into a candidate spec list; blocking checkpoint,
     merges/splits negotiated here, not silently.
   - `detail-spec` (loop) — per accepted candidate, `draft-spec`: write Context / Acceptance criteria (the
     digested GWT rules, verbatim, where they exist) / Out of scope / Open questions, applying `spec-rules`.
     Blocking checkpoint per spec.
   - `collect-open-questions` — gather every spec's open questions in one place; blocking checkpoint. Never
     invent an answer (`no-invented-requirements`) — resolved ones fold back into their spec, the rest keep
     `status: blocked`.
   - `finalize` — write every spec file, write/update `specs/README.md` as an index, summarise, set `Next`.
     Blocking checkpoint.
5. **Finish** — once `requirements-analysis.done-when` holds, the run is done.

Entirely sequential, like `digester` — every step is judgement (modelling, drafting) or a checkpoint; nothing
here benefits from parallel subagents.

## Checkpoint protocol

Same protocol as `developer` / `digester`:

- `type: ask` — put the `prompt` to the developer and wait.
- `type: notify` — inform, don't wait. Used in `spec-style.md` for `derive-commands` / `derive-views` /
  `derive-use-cases` — mechanically derived from already-confirmed data, a hard stop would be noise.
- `blocking: true` — do not proceed without an answer.
- `when: <condition>` — only stop if the condition holds.
- `shows: [...]` — render these before asking.
- After the answer: record step + question + answer + resulting decision in the session's checkpoint log.
  "Adjust" means redo the current step in the new direction.

## Output — `specs/`

One file per accepted candidate: `specs/NNN-slug.md`. A `~~~spec` block (`id`, `title`, `status`,
optionally `shape`, `depends-on`) followed by four prose sections: Context / Acceptance criteria / Out of scope /
Open questions. `specs/README.md` indexes them (id, title, status, shape).

`shape` (from `classify-task-shape`) is a **tool-agnostic** hint — `new-module` / `new-behaviour` /
`change-behaviour` / `coverage-only` — never another tool's internal scenario id. Mapping a shape to, say,
`developer`'s scenarios is the human's (or that tool's) job, not analyst's.

## Language

- Converse with the developer in their language; match and switch with them.
- `spec-style` files, session files, `specs/*.md`, and `specs/README.md` stay in English.

## Resuming

Look in `.claude/sessions/` for `analysis-session-*.md`. On invocation with a match for this input (or `session=`
naming one directly): read it in full, state in one or two lines where things stand (which building blocks are
confirmed, current step, what's parked as an open question), re-announce the resolved style, and ask whether to
resume from the current step. Several matches and none named — list them and ask, as with style selection.

## Notes

- If the input matches no scenario the style describes, stop cleanly rather than inventing a process.
- If the style file fails validation, report the broken reference and ask whether to continue without that
  entry or stop.
- **analyst never references an id from `coding-style` / `developer` / `digest-style`.** It must work installed
  entirely on its own — whether or not `digester` or `developer` exist alongside it. This was violated once
  during the style's own build (a scenario-mapping heuristic leaked `developer`'s scenario ids) and fixed before
  install; keep it that way in any future change.
- One input, one session file. A follow-up analysis on a different input is a new run.
