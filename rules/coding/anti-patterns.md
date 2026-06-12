# Anti-Patterns for AI

The AI agent MUST detect, avoid, and actively remove these patterns when safe to do so.

## "Just make it work"

❌ Forbidden:
- writing code without tests
- ignoring failing tests
- stacking multiple risky changes before verification

Required response:
- stop
- reduce scope
- proceed incrementally

---

## Utility Dumping

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

## Anemic Domain Model

❌ Forbidden:
- data-only domain objects with all logic moved elsewhere

Required response:
- move business rules closer to the domain object or use-case boundary

---

## Interface Paranoia

❌ Forbidden:
- creating an interface for every class automatically
- creating abstractions without competing implementations or strategic reason

Required response:
- delete unnecessary interfaces
- keep one concrete class until abstraction is justified

---

## Mock-Driven Development

❌ Forbidden:
- testing implementation details through mocks
- verifying interaction counts when business behavior is what matters

Required response:
- test observable behavior instead

---

## God Classes

❌ Forbidden:
- classes that validate, orchestrate, persist, log, transform, and make decisions all at once

Required response:
- split by responsibility
- preserve cohesive business intent

---

## Leaky Abstractions

❌ Forbidden:
- exposing framework details to the domain unnecessarily
- exposing mutable collections
- requiring callers to know internal invariants

Required response:
- restore encapsulation
- narrow the contract

---

## Comment-Driven Code

❌ Forbidden:
- comments that explain confusing code instead of improving it

Required response:
- rename
- extract
- simplify

---

## Null Tolerance

❌ Forbidden:
- accepting `null` as a normal internal case
- allowing "nullable by default" design

Required response:
- model absence explicitly

---

## Premature Abstraction

❌ Forbidden:
- introducing a generic abstraction before the second real use case exists
- creating extension points "for the future"

Required response:
- keep the design concrete until pressure for abstraction is real

---

## Framework-First Design

❌ Forbidden:
- shaping the domain around framework convenience
- allowing annotations, DTOs, persistence concerns, or transport objects to define the model

Required response:
- let the domain drive the structure
- adapt framework code around it

---

## Silent Rule Violation

❌ Forbidden:
- knowingly breaking a rule without mentioning it
- making trade-offs without surfacing them

Required response:
- explain the constraint
- explain the deviation
- keep deviation minimal
