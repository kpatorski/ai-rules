# ai-rules

A small set of always-on rules and a few skills for working with an AI coding assistant. The rules shape how the
assistant answers — how it explains, how sure it says it is, where it cites sources, how it formats Markdown — and
they apply in every project.

<!-- TOC -->
* [ai-rules](#ai-rules)
  * [Install](#install)
    * [Rules](#rules)
    * [Skills](#skills)
  * [What is inside](#what-is-inside)
    * [Rules](#rules-1)
    * [Skills](#skills-1)
  * [Updating](#updating)
  * [License](#license)
<!-- TOC -->

## Install

Clone this repository into `~/.ai`. It must live at exactly that path: the rule imports in `ai-rules.md` and the
commands in the skills use it literally, so a clone anywhere else will not load.

### Rules

Point Claude Code's user-level instructions at this repository. Pick one:

- **You have no `~/.claude/CLAUDE.md` yet** — link the one from this repository:

  ```bash
  ln -s ~/.ai/CLAUDE.md ~/.claude/CLAUDE.md
  ```

- **You already have one** — keep it and add this line to it:

  ```markdown
  @~/.ai/ai-rules.md
  ```

Start a new session and run `/memory` to confirm that `ai-rules.md` and every file under `rules/` are loaded.

### Skills

Each skill is a directory under `skills/`. Link the ones you want into `~/.claude/skills/`:

```bash
mkdir -p ~/.claude/skills
ln -s ~/.ai/skills/editor ~/.claude/skills/editor
ln -s ~/.ai/skills/tutor  ~/.claude/skills/tutor
ln -s ~/.ai/skills/refine ~/.claude/skills/refine
```

## What is inside

### Rules

`ai-rules.md` is the index: it lists every rule with a one-line summary and imports its full text. On a conflict,
these rules win over project-level rules.

- [feynman-technique](rules/feynman-technique.md) — explain in plain language, with an analogy, step by step.
- [epistemic-honesty](rules/epistemic-honesty.md) — no guessing; an explicit `Confidence: NN%` on substantive claims.
- [researcher-rule](rules/researcher-rule.md) — a cited source for every factual claim.
- [response-language](rules/response-language.md) — answer in the user's language, even though the rules are in
  English.
- [markdown-tables](rules/markdown-tables.md) — column-aligned tables that pass IntelliJ's table inspection.
- [markdown-line-length](rules/markdown-line-length.md) — prose wrapped at 120 columns.
- [multi-point-messages](rules/multi-point-messages.md) — one point per line, never a wall of text.
- [no-ai-attribution](rules/no-ai-attribution.md) — no mention of AI in commits or pull requests.
- [present-state-only](rules/present-state-only.md) — deliverables state how things are now, not how they got there.
- [no-commit-without-approval](rules/no-commit-without-approval.md) — no commit, push or pull request without the
  user's yes.
- [branch-before-changes](rules/branch-before-changes.md) — every change happens under git, on a branch the user
  confirmed.

### Skills

- [editor](skills/editor/SKILL.md) — drafts a message (email, note, announcement) from a few optional parameters.
- [tutor](skills/tutor/SKILL.md) — teaches a topic one concept at a time and keeps the plan in `learning-path.md`.
- [refine](skills/refine/SKILL.md) — a question-and-answer loop over a requirements story, on a self-contained
  HTML review page. Runs only when typed as `/refine`; needs Node 18 or newer.

## Updating

```bash
git -C ~/.ai pull
```

New and changed rules take effect in the next session.

## License

[PolyForm Internal Use License 1.0.0](LICENSE.md) — free to use, including commercially, for your own internal
purposes. Redistribution (forking and republishing, mirroring, or otherwise passing this repository or a modified
version of it on to third parties) is not permitted.
