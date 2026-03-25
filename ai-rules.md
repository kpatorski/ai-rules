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

### 2.1 TDD First (Required)

You MUST:
1. write the test first
2. run the test and verify that it fails
3. implement the minimal amount of production code
4. run the test and verify that it passes
5. refactor safely
6. rerun the full relevant test suite

❌ Forbidden:
- writing production code first
- skipping the failing-test phase
- making large implementation jumps without test feedback

---

### 2.2 Iterative Work

After **every change**:
- the project MUST compile
- all relevant tests MUST pass

If something fails:
- STOP
- FIX the problem immediately
- DO NOT continue to the next task while the project is broken

---

### 2.3 Code Style

- Use the **default formatting conventions of the language**
- Avoid custom or inconsistent formatting
- Prefer consistency over personal style

---

## 3. Clean Code

### 3.1 Encapsulation

- Always prefer the lowest possible visibility:

```text
private → package-private → public
```

- Increase visibility ONLY when required
- Do NOT expose internal state unless necessary
- Do NOT expose mutable collections directly

Example:

❌ Bad:
```java
public List<Reservation> reservations;
```

✅ Good:
```java
private final List<Reservation> reservations;

List<Reservation> reservations() {
    return List.copyOf(reservations);
}
```

---

### 3.2 Lombok

- Prefer Lombok annotations over handwritten boilerplate
- Use fluent APIs where appropriate
- Prefer chained setters and fluent accessors when the project style supports them

Exception:
- when a framework requires standard JavaBeans naming or proxy compatibility

---

### 3.3 Interfaces over Inheritance

- Prefer composition and interfaces
- Avoid inheritance unless it is clearly necessary

Do NOT create interfaces when:
- there is only one realistic implementation
- there is no meaningful abstraction
- the interface exists only because “interfaces are good”

NEVER use names such as:
```text
SomethingServiceImpl
```

Example:

❌ Bad:
```java
interface ReservationService {}
class ReservationServiceImpl implements ReservationService {}
```

✅ Better:
```java
class CreateReservation {}
```

---

### 3.4 Naming

- Use explicit, domain-driven names
- Follow the ubiquitous language of the domain
- Prefer names that describe **intent and business meaning**

❌ Forbidden names:
- helper
- util
- manager
- handler
- resolver
- maintainer
- processor (when vague)
- impl suffix

These names usually indicate weak design or unclear responsibility.

- Avoid meaningless abbreviations
- Avoid names that hide business intent
- Prefer verb-based use-case names where appropriate

✅ Preferred:
```java
CreateReservation
CancelReservation
AssignDesk
CloseVoting
```

❌ Avoid:
```java
ReservationManager
ReservationHelper
VoteUtil
```

---

### 3.5 Functional Style

- Prefer functional constructs where they improve clarity:
  - `Optional`
  - `Stream`
  - `Either`
  - `Result`

Example:

❌ Bad:
```java
if (value == null) {
    return null;
}
```

✅ Good:
```java
return Optional.ofNullable(value);
```

---

### 3.6 Null Handling

- NEVER pass `null` internally
- Only allow `null` when required by external frameworks or APIs

Use:
- `Optional`
- `Result`
- `Either`

Do NOT:
- write defensive null checks for trusted internal code
- normalize bad internal contracts by silently accepting null

---

### 3.7 Exceptions

- Prefer returning:
  - `Result`
  - `Optional`
  - domain-specific result types

- Avoid using exceptions for control flow

If you must throw:
- throw a **custom runtime exception**
- use a precise, domain-specific name
- do NOT throw raw or generic exceptions
- do NOT throw checked exceptions unless external APIs force it

Example:

```java
class ReservationNotPossible extends RuntimeException {
    private ReservationNotPossible(String message) {
        super(message);
    }

    static ReservationNotPossible becauseSlotIsTaken() {
        return new ReservationNotPossible("Slot is already taken");
    }
}
```

---

### 3.8 Comments

- NEVER add comments to explain how code works
- Code should be self-explanatory

Comments are acceptable ONLY for:
- legal headers required by policy
- public API documentation when necessary
- non-obvious external constraints
- temporary TODOs when explicitly requested and clearly actionable

---

### 3.9 Libraries

Before creating utility methods, check whether the functionality already exists in:
- Apache Commons
- Vavr
- the language standard library
- the framework already used in the project

Do NOT create project-local utilities prematurely.

---

### 3.10 Void Methods

Do NOT write:

```java
return;
```

inside `void` methods unless it materially improves readability in a guard clause.

Default rule:
- avoid unnecessary `return;` in `void` methods

---

### 3.11 Cognitive Load

- Optimize for readability
- Reduce mental overhead
- Prefer clarity over cleverness
- Prefer one obvious path over multiple subtle ones

---

### 3.12 SOLID

- ALWAYS follow SOLID principles
- If a rule appears to conflict with SOLID, redesign rather than forcing the code through

---

### 3.13 Code Duplication

- Be careful with “apparent duplication”
- Do NOT deduplicate too early
- Evaluate duplication in the context of:
  - SOLID
  - bounded contexts
  - architecture boundaries
  - different business meanings

Not all similar code should be merged.

---

### 3.14 Modern API Usage

- Use modern language and library APIs when they improve readability and correctness

Example:

```java
"Hello %s".formatted(name)
```

instead of:

```java
"Hello " + name
```

- Prefer static imports when they make intent clearer
- Do NOT use modern APIs just for novelty; use them when they improve the code

---

## 4. Testing

### 4.1 TDD

- Always begin with tests
- The red-green-refactor cycle is required

---

### 4.2 BDD Style

- Tests MUST describe behavior, not implementation
- Think in scenarios
- Write tests the way a product owner would describe expected behavior

❌ Bad:
```java
shouldCallRepository()
testValidation()
validNameTest()
```

✅ Good:
```java
reservationIsCreatedWhenSlotIsAvailable()
emptyNameIsRejected()
validResolutionIsSaved()
voteIsRejectedAfterDeadline()
```

Avoid including the tested method name in the test name unless:
- the class is a small utility
- method-level naming is genuinely clearer

---

### 4.3 Chicago School (Preferred)

- Verify observable behavior
- Prefer state that is externally visible through the public or package-private API
- Avoid interaction-heavy tests

Do NOT default to mocks.

---

### 4.4 Black Box Testing

- Test through:
  - public APIs
  - package-private APIs
  - meaningful package entry points

Do NOT:
- test private methods directly
- use reflection
- verify internal fields
- couple tests to implementation details

Focus on:
- inputs
- outputs
- externally visible behavior

---

### 4.5 What a Unit Means

A unit does NOT have to be a single class.

A unit may be:
- a package
- a use case
- a module
- a cohesive domain slice

Prefer testing through package-level entry points over testing tiny internal classes in isolation.

---

### 4.6 When to Mock

Mocking is allowed only when it has a clear reason, for example:
- external systems (DB, HTTP, SFTP, queues)
- non-deterministic behavior (current time, random values)
- explicit error simulation
- a complex dependency that already has reliable coverage elsewhere

Do NOT use mocks to avoid designing better seams.

---

### 4.7 Fixtures

Use fixtures for:
- complex test objects
- repeated setup
- domain scenarios that appear in many tests

Keep fixtures:
- readable
- domain-oriented
- free from unnecessary technical detail

Example:
```java
aValidReservation()
aReservationWithExpiredDeadline()
aResolutionReadyForVoting()
```

---

## 5. Architecture

- Follow **DDD principles**
- Prefer:
  - Clean Architecture
  - Hexagonal Architecture
  - Onion Architecture

You MUST:
- encapsulate domain logic
- isolate bounded contexts
- keep application logic separate from infrastructure
- protect the domain from framework leakage where practical

---

## 6. Domain Examples

### 6.1 Reservation Engine / Deskify-style Domain

Typical concepts:
- availability windows
- reservation intents
- desk reservations
- booking cycles
- time ranges
- workplace scope

Preferred use-case naming:
```java
CreateAvailabilityWindow
ReserveTimeRange
CancelReservation
CreateBookingCycle
AssignDeskReservation
```

Preferred test naming:
```java
reservationIsRejectedWhenTimeRangeOverlaps()
nextBookingCycleIsCreatedBeforeCurrentCycleEnds()
deskReservationIsCreatedFromAcceptedIntent()
```

Avoid:
```java
ReservationManager
BookingCycleHelper
DeskResolver
```

---

### 6.2 Voting / Votify-style Domain

Typical concepts:
- resolution
- voting
- resident
- quorum
- deadline
- housing community

Preferred use-case naming:
```java
CreateResolution
VoteInFavor
VoteAgainst
CloseVoting
AddResident
```

Preferred test naming:
```java
voteIsRejectedAfterDeadline()
resolutionIsAcceptedWhenQuorumIsReached()
residentCannotVoteTwiceForTheSameResolution()
cancelledResolutionCannotBeVotedOn()
```

Avoid:
```java
VoteManager
ResolutionHelper
CommunityHandler
```

---

## 7. ANTI-PATTERNS FOR AI

The AI agent MUST detect, avoid, and actively remove these patterns when safe to do so.

### 7.1 “Just make it work”

❌ Forbidden:
- writing code without tests
- ignoring failing tests
- stacking multiple risky changes before verification

Required response:
- stop
- reduce scope
- proceed incrementally

---

### 7.2 Utility Dumping

❌ Forbidden:
- `StringUtils` created inside the project without strong reason
- `DateHelper`
- `ReservationManager`
- `VoteUtil`

Smell:
- unrelated logic dumped into one vague class

Required response:
- move logic into domain objects, use cases, or existing libraries

---

### 7.3 Anemic Domain Model

❌ Forbidden:
- data-only domain objects with all logic moved elsewhere

Required response:
- move business rules closer to the domain object or use-case boundary

---

### 7.4 Interface Paranoia

❌ Forbidden:
- creating an interface for every class automatically
- creating abstractions without competing implementations or strategic reason

Required response:
- delete unnecessary interfaces
- keep one concrete class until abstraction is justified

---

### 7.5 Mock-Driven Development

❌ Forbidden:
- testing implementation details through mocks
- verifying interaction counts when business behavior is what matters

Required response:
- test observable behavior instead

---

### 7.6 God Classes

❌ Forbidden:
- classes that validate, orchestrate, persist, log, transform, and make decisions all at once

Required response:
- split by responsibility
- preserve cohesive business intent

---

### 7.7 Leaky Abstractions

❌ Forbidden:
- exposing framework details to the domain unnecessarily
- exposing mutable collections
- requiring callers to know internal invariants

Required response:
- restore encapsulation
- narrow the contract

---

### 7.8 Comment-Driven Code

❌ Forbidden:
- comments that explain confusing code instead of improving it

Required response:
- rename
- extract
- simplify

---

### 7.9 Null Tolerance

❌ Forbidden:
- accepting `null` as a normal internal case
- allowing “nullable by default” design

Required response:
- model absence explicitly

---

### 7.10 Premature Abstraction

❌ Forbidden:
- introducing a generic abstraction before the second real use case exists
- creating extension points “for the future”

Required response:
- keep the design concrete until pressure for abstraction is real

---

### 7.11 Framework-First Design

❌ Forbidden:
- shaping the domain around framework convenience
- allowing annotations, DTOs, persistence concerns, or transport objects to define the model

Required response:
- let the domain drive the structure
- adapt framework code around it

---

### 7.12 Silent Rule Violation

❌ Forbidden:
- knowingly breaking a rule without mentioning it
- making trade-offs without surfacing them

Required response:
- explain the constraint
- explain the deviation
- keep deviation minimal

---

## 8. SAFE REFACTORING RULES

The AI agent MUST treat refactoring as a **safety-critical activity**.

### 8.1 Preserve Behavior First

Before refactoring:
- ensure behavior is covered by tests
- add missing characterization tests if needed

Do NOT refactor behavior you do not understand.

---

### 8.2 One Intent per Change

Each refactoring step should have one clear purpose, for example:
- rename only
- extract method only
- move class only
- replace data structure only

Do NOT mix refactoring with unrelated feature work unless explicitly requested.

---

### 8.3 Small Steps Only

Refactor in small, reversible steps.

After each step:
- compile
- run tests
- confirm behavior remains unchanged

---

### 8.4 Protect Public Contracts

Do NOT change public behavior accidentally.

Before changing:
- identify public APIs
- identify package entry points
- identify serialization, persistence, and framework contracts
- identify naming relied upon by configuration or reflection

---

### 8.5 Prefer Structural Improvement over Clever Rewrites

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

### 8.6 Preserve Domain Language

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

### 8.7 Refactor Toward Better Boundaries

Safe refactoring should improve:
- encapsulation
- naming
- separation of concerns
- bounded-context clarity
- testability through public/package-private seams

---

### 8.8 Remove Dead Code Carefully

Before deleting code:
- verify it is truly unused
- check tests, configuration, serialization, framework references, and reflection-based usage
- check whether the code is part of backward compatibility expectations

If uncertain:
- prefer deprecation or a clearly isolated follow-up task

---

### 8.9 Avoid Test Damage

Do NOT “fix” tests by making them weaker.

Forbidden shortcuts:
- deleting failing assertions without reason
- replacing precise assertions with vague ones
- adding mocks only to force tests green
- rewriting tests to match broken code when behavior should stay unchanged

---

### 8.10 Keep Diffs Reviewable

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

### 8.11 Respect Existing Conventions

When refactoring existing code:
- respect the project’s current architecture and style
- improve gradually
- do NOT impose a totally new style across the codebase without an explicit request

---

### 8.12 Explain Risky Refactors

If a refactor has elevated risk, the AI MUST explicitly state:
- what changed
- why it is safe
- what contracts may be affected
- what should be verified next

---

## 9. Final Rule

If something violates these rules:

- STOP
- FIX the issue
- DO NOT proceed while the project is in a broken or unsafe state

These rules are STRICT and ENFORCED.
