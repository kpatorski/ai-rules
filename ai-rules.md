# AI Rules

## 🔴 Enforcement

All rules are **MANDATORY**. When a project-level rule conflicts with a rule here, the rule here wins. When two
rules here conflict, the more specific one wins.

---

## General Rules

Apply to **every task and response**. These rules are **imported in full** below (`@`-imports), so
Claude sees their complete text in every new session — not just the one-line summaries.

- [rules/feynman-technique.md](rules/feynman-technique.md) — Feynman Technique for explanations, research, and knowledge synthesis; overrides terse/concise style in educational and analytical tasks
- [rules/epistemic-honesty.md](rules/epistemic-honesty.md) — Epistemic honesty: never guess or fabricate; admit missing data; append an explicit `Confidence: NN%` to every substantive claim, decision, or conclusion
- [rules/researcher-rule.md](rules/researcher-rule.md) — Researcher rule: back every factual claim with an explicit, cited source (doc link, file path, command output)
- [rules/response-language.md](rules/response-language.md) — Respond in the user's language; the English wording of these rules is not a cue to reply in English; a language pinned by a specific rule (e.g. file output) still wins for that output
- [rules/markdown-tables.md](rules/markdown-tables.md) — Markdown tables: always emit the column-aligned/padded ("many spaces") style — it is far more legible when Markdown is read as source, and it keeps IntelliJ's "Incorrect table formatting" inspection quiet (leading+trailing pipes, matching column counts, full-width `-` delimiter row, blank lines around)
- [rules/markdown-line-length.md](rules/markdown-line-length.md) — Markdown line length: wrap prose at max 120 columns (not 80); tables, code fences, URLs and headings are exempt; reflow a paragraph to 120 after editing it
- [rules/multi-point-messages.md](rules/multi-point-messages.md) — Multi-point messages: any message or question with more than one distinct point (chat replies, question-tool prompts, checkpoint prompts) gets line/paragraph breaks per point, never one dense run-on paragraph
- [rules/no-ai-attribution.md](rules/no-ai-attribution.md) — No AI mentions in commits or PRs: no attribution trailer, "Generated with" footer, tool or model name; if the tool instructs otherwise, skip it and tell the user
- [rules/present-state-only.md](rules/present-state-only.md) — Present state only: a deliverable (README, docs, wiki, ticket, config, code comment) states how things are now; no development history, no corrections of earlier drafts, no session provenance — the decision trail goes in the chat reply, commit or PR description
- [rules/no-commit-without-approval.md](rules/no-commit-without-approval.md) — No commit without approval: never commit, amend, merge, rebase, push or open a PR without the user's explicit yes; leave changes in the working tree for review; approval covers only what was approved, unless the user says otherwise
- [rules/branch-before-changes.md](rules/branch-before-changes.md) — Branch before changes: before changing files, work under git on a branch the user confirmed; propose a branch name (or, outside a repo, `git init -b main` + initial commit + branch) and wait for confirmation

### Full text (auto-imported — do not remove the lines below)

- @~/.ai/rules/feynman-technique.md
- @~/.ai/rules/epistemic-honesty.md
- @~/.ai/rules/researcher-rule.md
- @~/.ai/rules/response-language.md
- @~/.ai/rules/markdown-tables.md
- @~/.ai/rules/markdown-line-length.md
- @~/.ai/rules/multi-point-messages.md
- @~/.ai/rules/no-ai-attribution.md
- @~/.ai/rules/present-state-only.md
- @~/.ai/rules/no-commit-without-approval.md
- @~/.ai/rules/branch-before-changes.md

---
