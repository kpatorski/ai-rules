# analyst — skill

Turns a requirements input into reviewed, written task specs — event storming (or whatever your own analysis
method is) run in a HUMAN <-> AI loop, one confirmed building block at a time, instead of a guessed backlog.

Invoke with `/analyst <input>` or a trigger phrase ("analyze these requirements", "run event storming on this",
"turn this into specs", "resume the analysis").

## Files here

| File                      | What it is                                                                          |
|----------------------------|---------------------------------------------------------------------------------------|
| `SKILL.md`                 | The skill itself. Frontmatter `name: analyst`.                                        |
| `spec-style-TEMPLATE.md`   | Authoring guide: how to write a `spec-style` file. Format reference + worked example. |
| `README.md`                | This file.                                                                            |

## How it runs

1. **Load a style** — from `~/.claude/spec-styles/<name>.md`, or a project's own
   `<project>/.claude/spec-style.md`. Selection: `style=<name|path>` arg > project file > sole global style >
   ask.
2. **Ingest** — the raw input, plus (optionally) a `business-rules.md` from the `digester` skill or written by
   hand. Authoritative when present; analyst runs fine without it too.
3. **Dispatch** — match `scenario-analyze-input`, run `requirements-analysis`: restate understanding → event
   storming (events, their rules, aggregates, commands, views, use cases, bounded contexts) → candidate specs →
   per-spec drafting → open questions → finalize. Every building block stops for confirmation.
4. **Write** `specs/NNN-slug.md` files (Context / Acceptance criteria / Out of scope / Open questions) plus a
   `specs/README.md` index.
5. **Persist** — progress goes to `analysis-session-<slug>.md` in the working directory; resumable.

## Downstream

A spec's `shape` field (`new-module` / `new-behaviour` / `change-behaviour` / `coverage-only`) is a
tool-agnostic hint, not another skill's scenario id. Hand a spec to `/developer` (or any tool, or a human) —
that's a loose, manual handoff; `analyst` never calls another skill directly and never hardcodes its ids.

## Styles

Live in `~/.claude/spec-styles/` (symlinked to `~/.ai/spec-styles/`). Add one by following
`spec-style-TEMPLATE.md` — the core of a style is usually your own analysis method (event storming, or whatever
you actually do), not a generic checklist.
