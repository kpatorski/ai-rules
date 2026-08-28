# AI Rules

## 🔴 Enforcement

All rules are **MANDATORY**. When rules conflict: prefer the more restrictive rule. Local project rules (`.claude`, `.clinerules`, `.cline`, `.gemini`) override global rules — preserve their intent, not just their wording.

---

## General Rules

Apply to **every task and response**. These are non-coding rules and are **imported in full**
below (`@`-imports), so Claude sees their complete text in every new session — not just the
one-line summaries.

- [rules/feynman-technique.md](rules/feynman-technique.md) — Feynman Technique for explanations, research, and knowledge synthesis; overrides terse/concise style in educational and analytical tasks
- [rules/epistemic-honesty.md](rules/epistemic-honesty.md) — Epistemic honesty: admit uncertainty, provide confidence as `Pewność: XX%` on every substantive answer
- [rules/no-guessing-and-confidence.md](rules/no-guessing-and-confidence.md) — No guessing: never invent facts; append explicit confidence score (0–100%) on every non-trivial claim
- [rules/researcher-rule.md](rules/researcher-rule.md) — Researcher rule: back every factual claim with an explicit, cited source (doc link, file path, command output)

### Full text (auto-imported — do not remove the lines below)

@~/.ai/rules/feynman-technique.md
@~/.ai/rules/epistemic-honesty.md
@~/.ai/rules/no-guessing-and-confidence.md
@~/.ai/rules/researcher-rule.md

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
