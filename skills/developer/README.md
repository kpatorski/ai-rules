# developer — skill

Drives a coding task the way I work: a HUMAN <-> AI loop, small checkpoint-gated moves, no large
generated drop. The *process* is data I authored in a `coding-style` file; this skill executes it.

Invoke with `/developer <task>` or a trigger phrase ("add a use case", "let's TDD this",
"resume the coding session", …).

## Files here

| File                        | What it is                                                                          |
|-----------------------------|-----------------------------------------------------------------------------------|
| `SKILL.md`                  | The skill itself — instructions Claude follows. Frontmatter `name: developer`.       |
| `coding-style-TEMPLATE.md`  | Authoring guide: how to write a `coding-style` file. Format reference + skeleton.   |
| `README.md`                 | This file.                                                                          |

## How it runs

1. **Load a style** — from `~/.claude/coding-styles/<name>.md`, or a project's own
   `<project>/.claude/coding-style.md` (a full style, or `extends: <name>` + overrides).
   Selection: `style=<name|path>` arg > project file > the sole global style > ask.
2. **Dispatch** — match the task to a `scenario`, build the plan from its `procedure`.
3. **Walk the plan** — step by step, applying the style's rulesets/heuristics, stopping at every
   `checkpoint` to confirm direction.
4. **Persist** — progress goes to a per-task `coding-session-<slug>.md` in the working directory,
   so one task can span many sessions (resume by re-invoking).

## Styles

Live in `~/.claude/coding-styles/` (symlinked to `~/.ai/coding-styles/`). One `.md` per style,
filename = style id:

- `java-ddd.md` — Java / Spock / DDD, TDD-first, black-box, Clean Architecture.

Add another (e.g. `python.md`) by following `coding-style-TEMPLATE.md`. With more than one style
present, the skill asks which to use unless `style=` or a project file pins one.

## Related

- `~/.ai/rules/coding/*` — the older prose coding rules `java-ddd.md` was distilled from. To be
  retired once the skill has proven out on real work.
