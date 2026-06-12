# Clean Code

## Encapsulation

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

## Lombok

- Prefer Lombok annotations over handwritten boilerplate
- Use fluent APIs where appropriate
- Prefer chained setters and fluent accessors when the project style supports them

Exception:
- when a framework requires standard JavaBeans naming or proxy compatibility

---

## Interfaces over Inheritance

- Prefer composition and interfaces
- Avoid inheritance unless it is clearly necessary

Do NOT create interfaces when:
- there is only one realistic implementation
- there is no meaningful abstraction
- the interface exists only because "interfaces are good"

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

## Naming

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

## Functional Style

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

## Null Handling

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

## Exceptions

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

## Comments

- NEVER add comments to explain how code works
- Code should be self-explanatory

Comments are acceptable ONLY for:
- legal headers required by policy
- public API documentation when necessary
- non-obvious external constraints
- temporary TODOs when explicitly requested and clearly actionable

---

## Libraries

Before creating utility methods, check whether the functionality already exists in:
- Apache Commons
- Vavr
- the language standard library
- the framework already used in the project

Do NOT create project-local utilities prematurely.

---

## Void Methods

Do NOT write:

```java
return;
```

inside `void` methods unless it materially improves readability in a guard clause.

Default rule:
- avoid unnecessary `return;` in `void` methods

---

## Cognitive Load

- Optimize for readability
- Reduce mental overhead
- Prefer clarity over cleverness
- Prefer one obvious path over multiple subtle ones

---

## SOLID

- ALWAYS follow SOLID principles
- If a rule appears to conflict with SOLID, redesign rather than forcing the code through

---

## Code Duplication

- Be careful with "apparent duplication"
- Do NOT deduplicate too early
- Evaluate duplication in the context of:
  - SOLID
  - bounded contexts
  - architecture boundaries
  - different business meanings

Not all similar code should be merged.

---

## Modern API Usage

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
