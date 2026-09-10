# Markdown Line Length — 120 columns

## 🔴 STATUS: MANDATORY

Applies to **every Markdown file** written or edited in any session — docs, READMEs, research
notes, skill definitions, PR descriptions, plan files, `.md` deliverables of any kind.

## The rule

- **Wrap prose at a maximum of 120 characters per line.** Not 80.
- Wrap at ~110–120; do not pad lines out artificially, just stop wrapping earlier than 80.
- Break at word boundaries. One thought may still span several lines.
- **Do not hard-wrap** inside these — let them run past 120 if needed:
  - table rows (the [markdown-tables.md](markdown-tables.md) padding rule governs those),
  - code fences and `~~~` blocks,
  - URLs and link targets,
  - headings.
- Reflow a paragraph to the 120 width after editing it — don't leave a mix of 80- and
  120-wrapped lines in the same block.

## Why

The user reads Markdown source with preview off in a wide editor. 80-column wrapping produces
needless line breaks that hurt readability at that width. 120 is the target; tables and code
are exempt because other rules or tooling own their formatting.

## Precedence

Per `ai-rules.md`: the more specific rule wins. [markdown-tables.md](markdown-tables.md) owns
table formatting; this rule owns prose line width. They do not conflict.
