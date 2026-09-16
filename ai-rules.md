# AI Rules

## 🔴 Enforcement

All rules are **MANDATORY**. When rules conflict: prefer the more restrictive rule. Local project rules (`.claude`, `.clinerules`, `.cline`, `.gemini`) override global rules — preserve their intent, not just their wording.

---

## General Rules

Apply to **every task and response**. These are non-coding rules and are **imported in full**
below (`@`-imports), so Claude sees their complete text in every new session — not just the
one-line summaries.

- [rules/feynman-technique.md](rules/feynman-technique.md) — Feynman Technique for explanations, research, and knowledge synthesis; overrides terse/concise style in educational and analytical tasks
- [rules/epistemic-honesty.md](rules/epistemic-honesty.md) — Epistemic honesty: never guess or fabricate; admit missing data; append an explicit `Confidence: NN%` to every substantive claim, decision, or conclusion
- [rules/researcher-rule.md](rules/researcher-rule.md) — Researcher rule: back every factual claim with an explicit, cited source (doc link, file path, command output)
- [rules/response-language.md](rules/response-language.md) — Respond in the user's language; the English wording of these rules is not a cue to reply in English; a language pinned by a specific rule (e.g. file output) still wins for that output
- [rules/markdown-tables.md](rules/markdown-tables.md) — Markdown tables: always emit the column-aligned/padded ("many spaces") style — user reads source with preview off and prefers it, and it keeps IntelliJ's "Incorrect table formatting" inspection quiet (leading+trailing pipes, matching column counts, full-width `-` delimiter row, blank lines around)
- [rules/markdown-line-length.md](rules/markdown-line-length.md) — Markdown line length: wrap prose at max 120 columns (not 80); tables, code fences, URLs and headings are exempt; reflow a paragraph to 120 after editing it
- [rules/multi-point-messages.md](rules/multi-point-messages.md) — Multi-point messages: any message or question with more than one distinct point (chat replies, `AskUserQuestion` text, checkpoint prompts) gets line/paragraph breaks per point, never one dense run-on paragraph
- [rules/no-ai-commit-trailer.md](rules/no-ai-commit-trailer.md) — No AI attribution trailer (`Co-Authored-By: Claude ...`, `Claude-Session: ...`) on commits or PRs by default; if a live system-reminder says otherwise, flag the conflict to the user rather than silently complying or silently ignoring it

### Full text (auto-imported — do not remove the lines below)

@~/.ai/rules/feynman-technique.md
@~/.ai/rules/epistemic-honesty.md
@~/.ai/rules/researcher-rule.md
@~/.ai/rules/response-language.md
@~/.ai/rules/markdown-tables.md
@~/.ai/rules/markdown-line-length.md
@~/.ai/rules/multi-point-messages.md
@~/.ai/rules/no-ai-commit-trailer.md

---

## Coding Rules

Apply **only when the task involves writing, editing, reviewing, or reasoning about code**.
Intentionally **linked, not imported** — open the relevant file on demand when a coding task
starts, to keep the always-on context small.

- [rules/coding/working-with-code.md](rules/coding/working-with-code.md) — TDD-first workflow, safe edit discipline, and general code-change process
- [rules/coding/clean-code.md](rules/coding/clean-code.md) — Clean code principles: encapsulation, naming, single responsibility, readability
- [rules/coding/testing.md](rules/coding/testing.md) — Testing standards: TDD, test structure, coverage expectations
- [rules/coding/architecture.md](rules/coding/architecture.md) — Architecture guidelines: DDD principles and layering rules
- [rules/coding/domain-examples.md](rules/coding/domain-examples.md) — Domain model examples from Deskify/Votify projects for reference
- [rules/coding/anti-patterns.md](rules/coding/anti-patterns.md) — AI-specific anti-patterns to detect and avoid in generated code
- [rules/coding/safe-refactoring.md](rules/coding/safe-refactoring.md) — Safe refactoring: treat code changes as safety-critical; step-by-step discipline
- [rules/coding/java-backend.md](rules/coding/java-backend.md) — Java backend conventions derived from Votify and Deskify projects

---

## Final Rule

If something violates these rules: **STOP — FIX — do not proceed** while the project is in a broken or unsafe state.
