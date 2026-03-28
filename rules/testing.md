# Testing

## TDD

- Always begin with tests
- The red-green-refactor cycle is required

---

## BDD Style

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

## Chicago School (Preferred)

- Verify observable behavior
- Prefer state that is externally visible through the public or package-private API
- Avoid interaction-heavy tests

Do NOT default to mocks.

---

## Black Box Testing

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

## What a Unit Means

A unit does NOT have to be a single class.

A unit may be:
- a package
- a use case
- a module
- a cohesive domain slice

Prefer testing through package-level entry points over testing tiny internal classes in isolation.

---

## When to Mock

Mocking is allowed only when it has a clear reason, for example:
- external systems (DB, HTTP, SFTP, queues)
- non-deterministic behavior (current time, random values)
- explicit error simulation
- a complex dependency that already has reliable coverage elsewhere

Do NOT use mocks to avoid designing better seams.

---

## Fixtures

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
