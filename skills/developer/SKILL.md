---
name: developer
description: >
  Drives a coding task the way the developer works, in a HUMAN <-> AI loop instead of one large generated drop.
  Reads a structured `coding-style` file (the developer's own process, encoded as scenario / procedure / step /
  checkpoint entries), matches the task to a scenario, and walks its procedure step by step — stopping at every
  checkpoint to confirm direction with the developer. Supports several named styles (per language, or several per
  language) selected per run. Progress is persisted to a per-task `coding-session-<slug>.md` in the working
  directory so one task can span many sessions. Trigger: "/developer", "work in my style", "add a use case",
  "let's TDD this", "drive this change with my coding style", "resume the coding session", "continue the developer
  loop".
argument-hint: "<task description> [style=<name|path>] [session=<path to coding-session file>]"
---

# developer

An orchestrator skill. It does not write a solution end to end and then report. It advances a coding task in small,
checkpoint-gated moves, following a process the developer authored in a `coding-style` file. The developer stays in
the loop at every decision point.

## Why this skill exists

Left to its defaults, an AI takes a coding task and produces a large block of code to review after the fact. By
then the direction is set and correcting it is expensive. This skill inverts that: the *process* is data the
developer wrote, the tool executes it, and it stops — visibly, on purpose — wherever the developer said "I would
not want to continue without checking". Big or hard-to-reverse moves never happen without an explicit go-ahead.

## The `coding-style` file — the process the tool executes

Named styles live at `~/.claude/coding-styles/<name>.md`. A project may carry its own at
`<project>/.claude/coding-style.md` — a full style, or a thin file with `extends: <name>` plus the entries it
overrides or adds.

Each entry is a fenced `~~~entry` YAML block under a `## <kind>` section with a stable `### <id>` anchor. Kinds:
`scenario` (`match`, `runs`, `preface-steps?`, `overrides?`), `procedure` (`steps`, `done-when`), `loop` (`steps`,
`until`), `step` (`belongs-to`, `checkpoint?`), `heuristic`, `ruleset` (`rules`, `applies-during`), `rule`,
`reference`. Full format: the `coding-style-TEMPLATE.md` authoring guide.

### Loading a style — do this first, every run

1. **Resolve which style**, in this order:
   - `style=<name|path>` on the invocation wins;
   - else `<project>/.claude/coding-style.md` if it exists (its `extends:` names the base);
   - else the sole file in `~/.claude/coding-styles/` if there is exactly one;
   - else list the available styles and ask the developer to pick.
2. **Merge** — if the project file `extends` a base: load the base, then for every entry `id` present in the
   project file, the project entry replaces the base entry; base-only entries are kept.
3. **Validate the merged style** — every `runs` / `steps` / `uses` / `belongs-to` / `rules` id must resolve to a
   defined entry (`applies-during: any` and procedure/loop ids in `applies-during` are valid). A dangling id —
   usually introduced by a project override — stops the run with the broken reference named, before any dispatch.
4. **Load safety** — if a named or `extends`-ed style file is not found, stop with a hard error naming the missing
   path. Never continue on a partial style.
5. **Announce** — print one line before any work: the resolved style name, the `extends` chain if any, the file
   paths actually loaded, and which entry `id`s the project override replaced.

## `coding-session-<slug>.md` — the state file

One file per task, in the working directory. A *task* is one run of the skill toward one goal ("add a
`CancelReservation` use case" is one task; backfilling tests for a class spotted during it is a separate task).
The filename slug is a short kebab-case reduction of the task statement, e.g.
`coding-session-cancel-reservation-use-case.md`. `session=<path>` on the invocation overrides the name.

The file is the single source of truth for where its task stands, across sessions. Written in English regardless of
conversation language. It holds:

- **Task** — the task statement, and the resolved scenario id. This is the human-readable "what is this file"
  line — keep it at the very top.
- **Status** — `active` / `blocked` / `done`, and the timestamp of the last update.
- **Style** — resolved style name, `extends` chain, loaded paths, overridden ids.
- **Plan** — the `preface-steps` then the `procedure` `steps`, in order, each marked `pending` / `active` /
  `done`. Loop steps show their iteration count.
- **Checkpoint log** — one entry per checkpoint reached: which step, what was asked, what the developer answered,
  the resulting decision. Append-only.
- **Parked** — coverage gaps and follow-ups deferred per `defer-discovered-gaps`, each to become its own later
  task.
- **Next** — the one line a future session resumes from.

Keep it current in the same turn as the event: a step starts or finishes, a checkpoint is answered, something is
parked, the plan is re-scoped. It must never lag the conversation.

## Capabilities

The skill is one orchestrator with named capabilities. Everything that writes code or reaches a checkpoint runs
sequentially in the main loop. Only `analysis` may fan out.

| Capability             | Does                                                                                       | Parallel            |
|------------------------|-------------------------------------------------------------------------------------------|---------------------|
| `style-loader`         | Resolve, merge, validate, announce the style                                               | no                  |
| `dispatch`             | Match the task to a `scenario`; build the plan (preface + procedure)                       | no                  |
| `analysis`             | Read-only work: locate, read existing tests, check coverage, mine sibling / reference code | read-only subagents |
| `test-authoring`       | `enumerate-test-cases`, test bodies in batches, the test-* rulesets                        | no                  |
| `production-authoring` | Minimal production code for a batch, the `production-code` ruleset                         | no                  |
| `refactor`             | Refactor tests then production, suite green throughout                                     | no                  |
| `checkpoint-manager`   | Halt, render `shows`, enforce `blocking`, record the answer                                | no                  |

### Parallel analysis

When a step is analysis-only and the work splits cleanly — e.g. read three sibling use-case packages, or scan
several reference projects for a convention — dispatch it to read-only subagents in parallel and collect the
findings. Never parallelise anything that writes to the repo, and never run two checkpoint streams at once. If in
doubt, stay single-threaded.

## Execution model

1. **Load the style** (`style-loader`), including the merged-style validation.
2. **Dispatch** — read the task. Find the `scenario` whose `match` fits. If none fits, tell the developer and ask
   whether to proceed with the closest procedure or stop. Apply the scenario's `overrides` (skip a step, force its
   outcome, relax a rule) to the plan.
3. **Open the session file** — pick the per-task filename (or `session=`), and create it with the task, status,
   style, and full ordered plan. If a matching file already exists, resume from it (see *Resuming*).
4. **Walk the plan** — `preface-steps` first, then the `procedure` `steps`, in order:
   - Run the step's action via the relevant capability.
   - If the step is a `loop`: run its inner `steps` once per iteration, re-checking `until` after each; honour the
     inner steps' checkpoints every iteration.
   - Apply every `ruleset` / `rule` whose `applies-during` names this step — directly, or via the `procedure` /
     `loop` it sits in, or `applies-during: any`. Apply any `heuristic` / `reference` the step `uses`.
   - A reused step (`belongs-to` is a list) takes its parent for this run from the walk it is on.
   - If the step has a `checkpoint`, hand to `checkpoint-manager` before moving on (honouring `when`).
   - Mark the step `done` in the session file; write any notes worth keeping.
5. **Finish** — when the procedure's `done-when` holds and its closing step is done (`finish-loop` for `tdd-loop`,
   `finish-characterize` for `characterize-loop`), summarise what was produced, list anything still parked, and
   set `Status: done` and `Next` to "nothing — <task> complete" or to the top parked item.

New test cases discovered while building the current behaviour → add a failing stub at once and keep going (that is
the loop working as intended). Gaps in unrelated existing code → park them per `defer-discovered-gaps`: say so in
one line to the developer, write the item to the session's `Parked` list, and do **not** widen the current change.

## Checkpoint protocol

A `checkpoint` is where the tool stops and talks to the developer.

- `type: ask` — put the `prompt` to the developer and wait for an answer.
- `when: <condition>` — only stop if the condition holds; otherwise the step is internal and the loop continues.
  No condition ⇒ always stop.
- `blocking: true` — do not take any further step, and do not write code past this point, without an answer. Every
  checkpoint before a large or hard-to-reverse move (including any git commit) is blocking.
- `shows: [...]` — render these before asking: `test-diff`, `production-diff`, `full-diff`, `file-list`, a stub
  list, a package tree — whatever the field names.
- After the answer: record step + question + answer + resulting decision in the session's checkpoint log, then act
  on it. "Adjust" means redo the current step in the new direction, not carry on.

Ask in the developer's language. Use a short, direct question; a numbered list of concrete options when the choice
is between discrete directions; free-form when it is open. Do not stack the next step's work "just in case" while
waiting.

## Language

- Converse with the developer in their language; match and switch with them.
- `coding-style` files, session files, and all code artefacts stay in English.
- Code identifiers, comments, and commit messages follow the target repository's convention.

## Resuming

On invocation:

- If `session=` is given, or exactly one unfinished `coding-session-*.md` exists, read it in full, state in one or
  two lines where things stand (task, scenario, current step, what is parked), re-announce the resolved style, and
  ask whether to resume from the current step or somewhere else.
- If several unfinished session files exist and none is named, list them (slug, task, current step, `Next`) and
  ask which to resume — the same "list and ask" pattern used for style selection.
- Do not restart a scenario from the top unless asked.

## Notes

- If the task matches no scenario and the developer does not want the closest procedure, stop cleanly — do not
  invent a process the style does not describe.
- Merged-style validation runs at load (step 1). If it still surfaces a broken reference mid-walk, report it and
  ask whether to continue without that entry or stop.
- The skill's defaults are a posture, not a cage: if the developer explicitly asks for a bigger step or to skip a
  checkpoint for one move, that is their call — note it in the checkpoint log and continue.
- One task, one session file. A genuinely separate task — including a parked follow-up picked up later — is a new
  run with its own `coding-session-<slug>.md`.
