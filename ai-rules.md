# AI RULES (FULL + ENFORCEMENT MODE)

## 🔴 CRITICAL: RULE ENFORCEMENT

These rules are **MANDATORY**, not optional guidelines.

The AI agent MUST:
- follow all rules in this file strictly
- follow all referenced rules strictly
- respect local project rules
- stop when a rule cannot be followed safely
- explain any necessary deviation explicitly

If rules conflict:
1. prefer the **more restrictive rule**
2. prefer **local project rules over global rules**
3. preserve the **intent** of the rule, not only its wording

---

## 1. General Principles

Whenever the AI agent performs any task, the rules defined in this file **and all referenced files MUST be followed**.

Additionally, rules located in project subdirectories MUST also be respected.

Relevant directories:
- `.claude`
- `.clinerules`
- `.cline`
- `.gemini`

These rules form a **hierarchical system**:
- global rules define the baseline
- local rules may refine or narrow behavior
- local rules override global rules when both apply

---

## 2. Working with Code

See [rules/working-with-code.md](rules/working-with-code.md)

---

## 3. Clean Code

See [rules/clean-code.md](rules/clean-code.md)

---

## 4. Testing

See [rules/testing.md](rules/testing.md)

---

## 5. Architecture

See [rules/architecture.md](rules/architecture.md)

---

## 6. Domain Examples

See [rules/domain-examples.md](rules/domain-examples.md)

---

## 7. Anti-Patterns for AI

See [rules/anti-patterns.md](rules/anti-patterns.md)

---

## 8. Safe Refactoring Rules

See [rules/safe-refactoring.md](rules/safe-refactoring.md)

---

## 9. Java Backend Rules

See [rules/java-backend.md](rules/java-backend.md)

---

## 10. Final Rule

If something violates these rules:

- STOP
- FIX the issue
- DO NOT proceed while the project is in a broken or unsafe state

These rules are STRICT and ENFORCED.
