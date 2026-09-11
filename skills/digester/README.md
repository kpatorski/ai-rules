# digester — skill

Turns raw requirements (a file, a URL, or pasted text) into Given/When/Then business rules — nothing more. No
domain modelling; that's `analyst`'s job. HUMAN <-> AI loop: extracted section by section, each batch confirmed
before the next.

Invoke with `/digester <input>` or a trigger phrase ("digest these requirements", "extract business rules",
"resume the digest").

## Files here

| File                       | What it is                                                                       |
|-----------------------------|-----------------------------------------------------------------------------------|
| `SKILL.md`                  | The skill itself. Frontmatter `name: digester`.                                   |
| `digest-style-TEMPLATE.md`  | Authoring guide: how to write a `digest-style` file. Format reference + skeleton. |
| `README.md`                 | This file.                                                                        |

## How it runs

1. **Load a style** — from `~/.claude/digest-styles/<name>.md`, or a project's own
   `<project>/.claude/digest-style.md`. Selection: `style=<name|path>` arg > project file > sole global style >
   ask.
2. **Dispatch** — match the input to `scenario-digest-input`, run `digest-requirements`.
3. **Extract section by section** — each batch of Given/When/Then rules stops for confirmation before the next.
4. **Write** `business-rules.md` — one `~~~rule` block per rule, grouped by input section.
5. **Persist** — progress goes to `digest-session-<slug>.md` in the working directory; resumable.

## Downstream

`business-rules.md` is plain structured data. `digester` doesn't know or assume who reads it next — `analyst`
treats it as authoritative optional input, but any tool or human can consume it directly. `digester` never
references another skill's ids; it installs and runs entirely on its own.

## Styles

Live in `~/.claude/digest-styles/` (symlinked to `~/.ai/digest-styles/`). Add one by following
`digest-style-TEMPLATE.md`.
