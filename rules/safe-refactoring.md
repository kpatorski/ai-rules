# Safe Refactoring Rules

The AI agent MUST treat refactoring as a **safety-critical activity**.

## Preserve Behavior First

Before refactoring:
- ensure behavior is covered by tests
- add missing characterization tests if needed

Do NOT refactor behavior you do not understand.

---

## One Intent per Change

Each refactoring step should have one clear purpose, for example:
- rename only
- extract method only
- move class only
- replace data structure only

Do NOT mix refactoring with unrelated feature work unless explicitly requested.

---

## Small Steps Only

Refactor in small, reversible steps.

After each step:
- compile
- run tests
- confirm behavior remains unchanged

---

## Protect Public Contracts

Do NOT change public behavior accidentally.

Before changing:
- identify public APIs
- identify package entry points
- identify serialization, persistence, and framework contracts
- identify naming relied upon by configuration or reflection

---

## Prefer Structural Improvement over Clever Rewrites

Prefer:
- rename
- extract
- inline
- move
- simplify dependencies
- reduce visibility
- isolate responsibilities

Avoid:
- large rewrites disguised as refactoring
- replacing known-working code with a completely different design in one step

---

## Preserve Domain Language

During refactoring:
- keep or improve ubiquitous language
- do NOT replace domain names with generic technical names

✅ Better:
```java
CloseVoting
```

❌ Worse:
```java
ProcessEntityStateChange
```

---

## Refactor Toward Better Boundaries

Safe refactoring should improve:
- encapsulation
- naming
- separation of concerns
- bounded-context clarity
- testability through public/package-private seams

---

## Remove Dead Code Carefully

Before deleting code:
- verify it is truly unused
- check tests, configuration, serialization, framework references, and reflection-based usage
- check whether the code is part of backward compatibility expectations

If uncertain:
- prefer deprecation or a clearly isolated follow-up task

---

## Avoid Test Damage

Do NOT "fix" tests by making them weaker.

Forbidden shortcuts:
- deleting failing assertions without reason
- replacing precise assertions with vague ones
- adding mocks only to force tests green
- rewriting tests to match broken code when behavior should stay unchanged

---

## Keep Diffs Reviewable

Changes should remain reviewable by a human.

Prefer:
- smaller diffs
- localized edits
- explicit renames
- obvious migration paths

Avoid:
- widespread unrelated formatting churn
- moving and rewriting the same file at once when possible to separate

---

## Respect Existing Conventions

When refactoring existing code:
- respect the project's current architecture and style
- improve gradually
- do NOT impose a totally new style across the codebase without an explicit request

---

## Explain Risky Refactors

If a refactor has elevated risk, the AI MUST explicitly state:
- what changed
- why it is safe
- what contracts may be affected
- what should be verified next
