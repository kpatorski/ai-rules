# Coding style — Krzysztof

A structured description of how I work with code, meant to be read and executed by an AI tool.

## How a tool loads this

- **Named styles** — each lives at `~/.claude/coding-styles/<name>.md` (filename = style id, e.g. `java-ddd`,
  `java-lean`, `python`). A project may carry its own at `<project>/.claude/coding-style.md` — either a full
  style, or a thin file that names a base with `extends: <name>` and adds/overrides entries.
- **Selection order** — (1) `style=<name|path>` on the run wins; (2) the project file, if present (its `extends:`
  names the base); (3) if exactly one global style exists, use it; (4) otherwise the tool lists the styles and
  asks.
- **Merge** — when a project file `extends` a base: a project entry overrides the base entry with the same `id`;
  base-only entries are inherited.
- **Validate after merge** — before any dispatch, check every `runs` / `steps` / `uses` / `belongs-to` / `rules`
  id resolves. A dangling id (often introduced by a project override) stops the run with the broken reference
  named.
- **Load safety** — if a run names a style that is not found, fail hard with the path; never skip it silently.
- **Announce** — at the start of every run, print one line: the resolved style, the `extends` chain, the files
  loaded, and which entry `id`s the project actually overrode.
- **Selective loading** — load the whole file, or just the entries a scenario needs: every entry has a stable
  `### <id>` anchor and sits under a `## <kind>` section.
- **Language** — this file is always English. The tool talks to the developer in the developer's language; only
  the persisted artefacts stay English.

---

## Format

Every entry is a fenced `~~~entry` block holding a YAML record. The `###` heading above it is for human navigation
only — the block is the source of truth. There is no prose outside the block; longer explanation goes in the
`description` field.

Entry kinds:

- `scenario` — a situation I recognise. Carries a `match` (when it applies) and `runs` (the procedure to execute).
  Optional `preface-steps` run before the procedure. Optional `overrides` — a map of `entry-id: how this scenario
  changes it` (skip a step, force its outcome, relax a rule), read by the tool before running the procedure.
- `procedure` — an ordered `steps` list. A step id may point to another `procedure`, a `loop`, or a `step`.
- `loop` — an ordered `steps` list repeated `until` a condition holds.
- `step` — a single action. `belongs-to` names its parent procedure or loop; when a step is reused across procedures
  it may be a list, and the tool takes the parent for a given run from the walk it is on.
- `heuristic` — a decision aid a step pulls in via `uses`.
- `ruleset` — a named group of `rules`, bound via `applies-during` to the steps it governs; an `applies-during`
  entry may also name a `procedure` or `loop` id, meaning "every step inside it, including nested loops".
- `rule` — a single constraint. `belongs-to` names its ruleset; a rule may also stand alone and bind directly via
  its own `applies-during`. `applies-during: any` means every step of every procedure.
- `reference` — declared configuration a step pulls in via `uses` (e.g. the architecture profile). Not a step and
  not a rule; it is data the tool reads to make decisions.

Common fields: `title`, `description`, `input`, `produces`, `uses` (a heuristic or reference this entry depends
on), `checkpoint`. Rulesets bind via `applies-during`, not via a step's `uses`.

A `checkpoint` is where the tool stops and talks to me:

- `type: ask` — ask the `prompt` and wait.
- `blocking: true` — must not proceed without my answer.
- `when: <condition>` — only stop when the condition holds; otherwise the step is internal and the loop continues.
- `shows` — artefacts to put in front of me (e.g. `test-diff`, `production-diff`).

Forward references are allowed — a step may `use` an entry defined later in the file.

---

## Scenarios

### scenario-new-use-case

~~~entry
id: scenario-new-use-case
kind: scenario
title: Add a new use case to an existing module
description: >
  A module whose bounded contexts, business rules and communication style (events,
  ports & adapters) are already decided; event storming is done. The new use case
  usually mirrors the structure of existing ones, but may introduce its own
  convention if it genuinely needs to.
match: task is to add or implement a new use case in a module that already has some
preface-steps: [locate-target, confirm-conventions, create-empty-package]
runs: tdd-loop
~~~

### scenario-change-existing-code

~~~entry
id: scenario-change-existing-code
kind: scenario
title: Change behaviour in existing code
description: >
  The kind of change is known (business requirements in hand). Very close to
  scenario-new-use-case, but the suite and production code already exist — the
  loop adds to them rather than creating from scratch.
match: task is to modify or extend the behaviour of code that already exists and has tests
preface-steps: [locate-target, read-existing-tests, check-coverage, restate-current-behaviour, confirm-conventions]
runs: tdd-loop
overrides:
  enumerate-test-cases: means adding stubs or assertions to the existing suite, following its convention
  decide-test-level: skip — the existing suite already fixes the level; only run it if the change shifts the level
~~~

### scenario-utils

~~~entry
id: scenario-utils
kind: scenario
title: Write or change a util
description: >
  Utils are avoided, but occasionally genuinely needed. A util is shared code, so
  it is tested at unit level — the class itself — never through a module entry
  point. This is the one place where a test name may reference the util method.
match: task is to add or change a genuine utility — stateless, shared, no domain identity
preface-steps: [challenge-the-util, locate-target]
runs: tdd-loop
overrides:
  decide-test-level: forced to util-unit-suite — skip the how-high-to-test question
  test-naming: the method-name exception applies — a test may name the util method when clearer
~~~

### scenario-missing-tests

~~~entry
id: scenario-missing-tests
kind: scenario
title: Cover existing code that lacks tests
description: >
  A gap in coverage on code that already works. Runs on its own; the tests land
  in a separate commit. If the current behaviour looks wrong, the gap is noted,
  not fixed here.
match: task is to add tests for existing, working behaviour that is currently uncovered
runs: characterize-loop
~~~

### scenario-bootstrap-module

~~~entry
id: scenario-bootstrap-module
kind: scenario
title: Found a new project or module
description: >
  A greenfield module. No sibling use cases to mirror, so structural decisions
  are made explicitly against architecture-profile. Ends by handing the first
  aggregate's case to scenario-new-use-case.
match: task is to start a new project or module from nothing
runs: bootstrap-module
~~~

---

## References

### architecture-profile

~~~entry
id: architecture-profile
kind: reference
title: Architecture the tool must respect
description: >
  Applied when the tool decides where a class lives and how modules talk.
  Anything already fixed by the existing project or a project-level style wins
  over this profile.
style: Clean Architecture — default, overridable per project
also-respect: [DDD tactical patterns, bounded-context isolation, application logic kept out of infrastructure]
layering:
  - domain has no dependency on framework, persistence or transport
  - use case orchestrates domain; depends inward only
  - adapters (entrypoint, db) depend on the use case, never the reverse
communication: events between bounded contexts; ports & adapters at the boundary
package-layout: see feature-structure rule
input-assumed: event storming is done — events, aggregates, commands, views are known before implementation starts
~~~

### default-stack

~~~entry
id: default-stack
kind: reference
title: Default JVM stack
description: >
  The stack from my Votify / Deskify projects. Names only — always resolve each
  to its latest stable version at bootstrap time. Overridable per project.
runtime: [Java latest LTS, Spring Boot, Lombok with fluent accessors, Liquibase, "online.goodcode:result"]
testing: [Spock with Groovy, JUnit Jupiter for TestContainers bootstrap only, TestContainers + PostgreSQL, REST-Assured, AssertJ]
persistence: PostgreSQL, schema owned by Liquibase, hibernate ddl-auto none
~~~

---

## Heuristics

### how-high-to-test

~~~entry
id: how-high-to-test
kind: heuristic
title: How high to test a behaviour
description: >
  Picks the level a behaviour is tested at. Production code is package-private by
  default; something is public only when it is part of the cross-module
  communication API. Test as high as possible so tests read in business language
  and avoid needless mocking and duplication. Class-per-class testing is the
  thing being avoided, not a fallback.
default: one-black-box-suite
levels:
  - id: one-black-box-suite
    when: default — behaviour reachable through a package / use-case entry point
  - id: dedicated-class-suite
    when: a class exists in its own right, not only to satisfy one collaborator
  - id: util-unit-suite
    when: the code is a shared util
  - id: split-suites-same-entry-point
    when: corner cases bloat one suite; several suites hit the same entry point, one concern each
  - id: extracted-strategy-suite
    when: the corner cases belong to a strategy that should be extracted, tested in full on its own, and stubbed in the main suite
questions:
  - id: a
    ask: Is there anything public in the module / package?
    then: that public thing is a candidate for its own suite
  - id: b
    ask: Does class X exist only to satisfy class Y — remove Y, is X still needed?
    then: X is a candidate for a dedicated-class-suite
  - id: c
    ask: Is it a util?
    then: util-unit-suite
revisit-when: >
  during cover-cycle or refactor-tests the suite is bloating with corner cases and
  losing readability — return here and propose split-suites-same-entry-point or
  extracted-strategy-suite as a checkpoint
~~~

### stub-vs-in-memory

~~~entry
id: stub-vs-in-memory
kind: heuristic
title: Stub or in-memory implementation for a collaborator
description: >
  Pick whichever reads better in the suite. The deciding factor is the number and
  complexity of the interface methods you would have to stub or implement — few
  simple methods lean stub; many methods, or interdependent state across calls,
  lean in-memory.
default: none — decided per case on readability
lean-stub-when: the interface has few, simple methods used in isolation
lean-in-memory-when: the interface has many methods, or the test needs consistent state across several calls
~~~

---

## Rulesets

### test-style

~~~entry
id: test-style
kind: ruleset
title: How a test suite should read
description: >
  A suite should read like a business analyst describing the system's
  requirements. It states behaviour, not mechanics — never which method was
  called or which argument was passed. Technical complexity is hidden behind
  small, human-named helpers.
rules: [test-naming, test-as-story, suite-layout]
applies-during: [enumerate-test-cases, cover-batch, refactor-tests, characterize-loop]
~~~

### test-naming

~~~entry
id: test-naming
kind: rule
belongs-to: test-style
title: Name a test by the state it describes
description: >
  The name states the resulting behaviour or state, not a wish and not the
  implementation. It describes the scenario in the product owner's language — the
  PO knows the business rules, not whether method X was called.
must:
  - no wish prefixes (shouldCreate..., testValidation, validNameTest)
  - no implementation terms in the name — no method names, no "calls X", no "passes Y"
exception: >
  a small utility class, or a case where method-level naming is genuinely
  clearer, may name the method
examples:
  good: [reservationIsCreatedWhenSlotIsAvailable, eventIsNotPublishedIfReservationFailed, emptyNameIsRejected]
  bad: [shouldCreateReservation, testValidation, validNameTest]
~~~

### test-as-story

~~~entry
id: test-as-story
kind: rule
belongs-to: test-style
title: Structure every test as given / when / then
description: >
  The body reads like prose. Use Spock's native given/when/then labels, or
  //given //when //then comments where the framework has none (JUnit). Each block
  is one or two intent-revealing calls, not a wall of setup. Stubbing and object
  building move into small helpers named in human language.
must:
  - every test has explicit given / when / then blocks
  - no inline mock wiring in the body when a named helper reads better
example: |
  void userIsNotCreatedIfUsernameIsAlreadyTaken() {
      // given existing users
      var userRepository = addUsersToRepository(user("user-a"), user("user-b"));

      // when create user of existing username
      var newUser = new CreateUser(userRepository).handle(command("user-b"));

      // then new user is not created
      assertTrue(newUser.isEmpty());
  }
~~~

### suite-layout

~~~entry
id: suite-layout
kind: rule
belongs-to: test-style
title: Tests on top, helpers at the bottom
description: >
  Test methods sit at the top of the class; helper methods (stubbing, asserting,
  building) sit at the bottom. The reader meets the business rules first. This is
  deliberately unlike production-code ordering.
~~~

### test-data

~~~entry
id: test-data
kind: ruleset
title: Values and object building in tests
description: >
  Test data should lower the reader's cognitive load: placeholder values signal
  "irrelevant here", and object building is factored out once it repeats.
rules: [dummy-values, test-fixtures]
applies-during: [cover-batch, refactor-tests, characterize-loop]
~~~

### dummy-values

~~~entry
id: dummy-values
kind: rule
belongs-to: test-data
title: Use placeholder values, not domain-specific ones
description: >
  Stubbed and built objects use repeatable placeholders like "any-name",
  "any-street". The value signals it is irrelevant to the behaviour under test.
default: one repeatable placeholder per field — "any-<field>"
unless:
  - the difference between two values matters for identity — use "any-name-a", "any-name-b"
  - the value carries business meaning (a zip-code that triggers a policy) — use the real business value
  - two objects are compared — use natural-language markers pointing at the crux — "same-tenant" / "different-street"
then: when the same value set repeats within a suite, hide it inside a local factory method
example: |
  var userA = user("same-name", "same-zip-code", "any-street", "same-tenant");
  var userB = user("same-name", "same-zip-code", "different-street", "same-tenant");
~~~

### test-fixtures

~~~entry
id: test-fixtures
kind: rule
belongs-to: test-data
title: Extract a Fixture when object building repeats across suites
description: >
  Same principle as extracting a helper method, but across suites. A
  package-level class (e.g. UserFixture) exposes intent-named builders and
  stubbers for complex objects.
when: the same complex build or stub appears in more than one suite
must:
  - fixture methods are domain-named (aValidReservation, aReservationWithExpiredDeadline)
  - fixtures stay readable, free of unnecessary technical detail
~~~

### test-frameworks

~~~entry
id: test-frameworks
kind: ruleset
title: Test tooling
description: >
  Readability-first tooling choices for suites.
rules: [framework-choice, mocking-tooling, junit-assertions]
applies-during: [scaffold-suite, cover-batch]
~~~

### framework-choice

~~~entry
id: framework-choice
kind: rule
belongs-to: test-frameworks
title: Spock by default, even on Java
description: >
  Spock is chosen for readability — native given/when/then, data tables,
  expressive assertions.
default: Spock, latest stable major
junit-when: the project already standardises on JUnit, or Groovy is unavailable in the build
~~~

### mocking-tooling

~~~entry
id: mocking-tooling
kind: rule
belongs-to: test-frameworks
title: Native Spock Mock/Stub; Mockito under JUnit
must:
  - Spock suites use Spock's own Mock() / Stub()
  - JUnit suites use Mockito
  - never mix mocking libraries within a suite
note: >
  this rule is only about which library — whether to mock at all is governed by
  stub-vs-in-memory and the black-box testing rules
~~~

### junit-assertions

~~~entry
id: junit-assertions
kind: rule
belongs-to: test-frameworks
title: AssertJ in JUnit suites
must:
  - JUnit suites assert with AssertJ — assertThat(...)
  - Spock suites use Spock's native condition blocks, not an assertion library
~~~

### production-code

~~~entry
id: production-code
kind: ruleset
title: Production code assessment
description: >
  Rules applied whenever production code is written or refactored. No imposed
  review order — each rule is checked on its own merit. Rules tagged `stack: jvm`
  are specific to the JVM / Spring stack this style targets.
rules: [visibility, naming, rich-domain, error-handling, interfaces,
        abstraction-timing, feature-structure, determinism, specifications,
        single-responsibility, framework-isolation, libraries-first,
        functional-style, no-explanatory-comments]
applies-during: [minimal-production-code, refactor-production]
~~~

### visibility

~~~entry
id: visibility
kind: rule
belongs-to: production-code
title: Lowest visibility by default
must:
  - classes and methods are package-private unless part of the cross-module communication API
  - never expose mutable collections — return a copy or an unmodifiable view
  - never leak framework or persistence types through a domain contract
~~~

### naming

~~~entry
id: naming
kind: rule
belongs-to: production-code
title: Domain-language names, verb-noun use cases
must:
  - use cases are verb-noun (CreateReservation, CloseVoting)
  - names follow the domain's ubiquitous language
forbidden: [Impl suffix, util, manager, helper, handler, resolver, vague "processor"]
~~~

### rich-domain

~~~entry
id: rich-domain
kind: rule
belongs-to: production-code
title: Behaviour lives on the domain object
must:
  - business rules sit on the domain object or the use-case boundary, not in a data-free service
  - domain business methods return a Result or an event — never void, never throws for business outcomes
avoid: anemic data-only domain objects
~~~

### error-handling

~~~entry
id: error-handling
kind: rule
belongs-to: production-code
title: Results over exceptions, no internal null
stack: jvm
must:
  - business failures return Result.failure(...) — exceptions are not control flow
  - never pass null internally; model absence with Optional / Result / Either
  - if you must throw, throw a named domain RuntimeException, never a raw or checked one
~~~

### interfaces

~~~entry
id: interfaces
kind: rule
belongs-to: production-code
title: No interface without a reason
must:
  - an interface needs a second real implementation or an explicit strategic reason (port, testing seam for a boundary)
  - never a SomethingServiceImpl — name the concrete class after what it does
~~~

### abstraction-timing

~~~entry
id: abstraction-timing
kind: rule
belongs-to: production-code
title: Stay concrete until the second use case
must:
  - no generic abstraction before a second real use case exists
  - no extension points "for the future"
  - apparent duplication is not merged until the shared meaning is real — weigh bounded contexts, SOLID, business meaning
~~~

### feature-structure

~~~entry
id: feature-structure
kind: rule
belongs-to: production-code
title: Organise by feature, not by layer
stack: jvm
must:
  - packages are organised by use case, not by technical layer
  - a use-case package is self-contained — its own entity representations, repository, events
  - two use cases never share entity classes even when they map to the same table
  - four-part shape — entrypoint (HTTP only) / use-case class / repository interface + db impl / domain entity
~~~

### determinism

~~~entry
id: determinism
kind: rule
belongs-to: production-code
title: No ambient time or randomness in business logic
must:
  - never call Instant.now() / LocalDate.now() directly in business logic — inject a Clock and pass it into domain methods
  - the same for random values and other non-deterministic sources
~~~

### specifications

~~~entry
id: specifications
kind: rule
belongs-to: production-code
title: Explicit business rules as Specifications
description: >
  When a business rule is worth naming and composing, model it with the
  Specification pattern rather than an inline boolean expression.
must:
  - specifications are named after the rule (IsDeskAvailableInCycle, IsBookingCycleNotStarted)
  - compose with and / or / not rather than nesting conditionals
when: the rule is reused, or complex enough that a name clarifies intent
~~~

### single-responsibility

~~~entry
id: single-responsibility
kind: rule
belongs-to: production-code
title: One responsibility per class
must:
  - no class that validates, orchestrates, persists, logs, transforms and decides at once
  - split by responsibility while keeping the business intent cohesive
  - follow SOLID; if a rule seems to fight SOLID, redesign rather than force it through
~~~

### framework-isolation

~~~entry
id: framework-isolation
kind: rule
belongs-to: production-code
title: The domain drives the structure
must:
  - the domain shape is not dictated by annotations, DTOs, persistence or transport objects
  - framework code adapts around the domain, not the other way round
~~~

### libraries-first

~~~entry
id: libraries-first
kind: rule
belongs-to: production-code
title: Check for an existing library before writing a util
must:
  - before creating a utility method, check Apache Commons, Vavr, the standard library, and the framework already in use
  - do not create project-local utilities prematurely
~~~

### functional-style

~~~entry
id: functional-style
kind: rule
belongs-to: production-code
title: Functional constructs where they clarify
stack: jvm
must:
  - prefer Optional / Stream / Either / Result over null checks and manual loops when it improves clarity
  - use modern language and library APIs (e.g. "x".formatted(y)) when they read better — not for novelty
~~~

### no-explanatory-comments

~~~entry
id: no-explanatory-comments
kind: rule
belongs-to: production-code
title: Rename and extract instead of commenting
must:
  - no comments that explain how confusing code works — rename, extract, simplify instead
allowed: [legal headers, public API docs where genuinely needed, non-obvious external constraints, explicitly-requested actionable TODOs]
~~~

### defer-discovered-gaps

~~~entry
id: defer-discovered-gaps
kind: rule
title: Park a coverage gap, don't derail
description: >
  Contrast with on-new-case behaviour in cover-cycle. A new case for the
  behaviour being built right now → add a stub immediately. A gap in unrelated,
  pre-existing code spotted mid-task → record it and keep going; address it
  afterwards as its own scenario-missing-tests run.
must:
  - never widen the current change to cover a newly spotted unrelated gap
  - the deferred gap becomes a separate commit later
  - tell the developer in one line when something is parked, and record it in the session's Parked list
applies-during: any
~~~

---

## Procedures

### tdd-loop

~~~entry
id: tdd-loop
kind: procedure
title: Test-first implementation loop
description: >
  The loop I run whenever I add or change behaviour. Not "write all tests, then
  all code" — it advances in small batches, and the design direction is confirmed
  with me before it hardens. Cases found mid-loop are captured as stubs at once.
steps: [decide-test-level, scaffold-suite, enumerate-test-cases, cover-cycle,
        snapshot-green, refactor-tests, refactor-production, finish-loop]
done-when: whole suite is green and both tests and production code are refactored
~~~

### bootstrap-module

~~~entry
id: bootstrap-module
kind: procedure
title: Module bootstrap
steps: [choose-stack, create-build, add-dependencies, scaffold-package-skeleton, base-configuration, pick-first-aggregate]
done-when: the module compiles, an empty test runs, and the first aggregate is chosen — ready for scenario-new-use-case
~~~

### characterize-loop

~~~entry
id: characterize-loop
kind: procedure
title: Characterization test loop
description: >
  Adds tests to code that already exists. No production code is written and
  nothing is designed — each test captures what the code does now.
steps: [decide-test-level, scaffold-suite, enumerate-cases-from-code, characterize-cycle, finish-characterize, commit-tests]
done-when: every observed behaviour path has a passing test and they are committed on their own
~~~

---

## Loops

### cover-cycle

~~~entry
id: cover-cycle
kind: loop
belongs-to: tdd-loop
title: Batch coverage cycle
description: >
  Each iteration covers a small batch of stubs and stops for my go-ahead before
  the next one. A stub discovered mid-iteration is added immediately, then the
  current iteration continues.
steps: [cover-batch, minimal-production-code, review-design-direction]
until: every stub from enumerate-test-cases has a passing body
~~~

### characterize-cycle

~~~entry
id: characterize-cycle
kind: loop
belongs-to: characterize-loop
title: Characterization batch cycle
steps: [characterize-batch]
until: every stub from enumerate-cases-from-code has a passing body
~~~

---

## Steps

### decide-test-level

~~~entry
id: decide-test-level
kind: step
belongs-to: [tdd-loop, characterize-loop]
title: Decide how high to test this
description: >
  Before scaffolding, decide the level the behaviour is tested at, using the how-high-to-test heuristic. Default is
  high / black-box through a package entry point; go lower only when that heuristic's reasons apply.
uses: how-high-to-test
produces: the chosen test level and the target entry point for the suite
checkpoint:
  type: ask
  blocking: true
  when: the level is not already fixed by an existing suite or obvious from the target class
  prompt: >
    I'd test this at <level> through <entry point>, because <reason>. Does that match how you'd frame it?
~~~

### scaffold-suite

~~~entry
id: scaffold-suite
kind: step
belongs-to: [tdd-loop, characterize-loop]
title: Create the empty test suite
description: >
  Create the test file(s) for the chosen level. Shape depends on the level: one suite per production class, one
  suite per use-case entry point, or several suites targeting the same entry point when corner cases would
  otherwise bloat a single suite.
produces: empty test file(s), no cases yet
~~~

### enumerate-test-cases

~~~entry
id: enumerate-test-cases
kind: step
belongs-to: tdd-loop
title: List every known test case as a failing stub
description: >
  Write down every business case discovered so far as an empty, failing stub — a
  titled test that just fails. The title states the scenario in the product
  owner's language. Nothing is implemented yet; the goal is a complete map of
  what the suite must prove.
produces: one failing stub per known business case, no bodies
example: |
  def "event is published if reservation succeed"() {
    expect:
    false
  }
checkpoint:
  type: ask
  blocking: true
  prompt: >
    Here is the full list of test cases. Complete and correct — anything to add,
    drop, or rename?
~~~

### cover-batch

~~~entry
id: cover-batch
kind: step
belongs-to: cover-cycle
title: Implement bodies for a small batch of stubs
description: >
  Take 2-3 stubs — few enough that the production code to satisfy them is a short
  step — and write their bodies. Tests only; production code is the next step.
input: the stub list from enumerate-test-cases
uses: stub-vs-in-memory
produces: implemented bodies for the current batch
~~~

### minimal-production-code

~~~entry
id: minimal-production-code
kind: step
belongs-to: cover-cycle
title: Write the least production code that makes the batch pass
description: >
  Implement only what makes the current batch green. No speculative structure. If
  writing it reveals a new case, add a failing stub for it right away and carry
  on.
uses: production-code
produces: production code making the current batch pass; suite green for covered stubs
~~~

### review-design-direction

~~~entry
id: review-design-direction
kind: step
belongs-to: cover-cycle
title: Confirm the design direction before the next batch
description: >
  Look at what the batch introduced — interfaces, public / package-private API,
  method and parameter names. State whether it is heading the right way and why.
produces: a shared decision to continue as-is or adjust the design
uses: how-high-to-test
checkpoint:
  type: ask
  blocking: true
  shows: [test-diff, production-diff]
  prompt: >
    This batch added <APIs / signatures>. I think it is going <well / off> because <reason>. Continue to the next
    batch, or adjust first? (If the suite is starting to bloat with corner cases, I'll also flag re-picking the
    test level per how-high-to-test.)
~~~

### snapshot-green

~~~entry
id: snapshot-green
kind: step
belongs-to: tdd-loop
title: Snapshot the green suite before refactoring
description: >
  Once the whole suite is green, take a snapshot so the refactor is reversible without disturbing the working
  tree: `git stash create` + `git stash store` (snapshot, not a revert — the tree stays intact for refactor-tests).
  A real checkpoint commit only if I ask.
produces: a restore point with all tests passing, working tree unchanged
~~~

### refactor-tests

~~~entry
id: refactor-tests
kind: step
belongs-to: tdd-loop
title: Refactor the tests first
description: >
  Assess the suite before the production code. Simplify methods, extract intent-
  revealing helpers, introduce fixtures where the same complex object is built
  repeatedly. Tests stay green throughout.
uses: how-high-to-test
produces: a suite that reads as prose, still green
checkpoint:
  type: ask
  blocking: true
  shows: [test-diff]
  prompt: "Tests after refactor — diff. Move on to the production code?"
~~~

### refactor-production

~~~entry
id: refactor-production
kind: step
belongs-to: tdd-loop
title: Refactor the production code
description: >
  Only once I am happy with the suite. Apply the production-code rules,
  re-running the full relevant suite after each change. Stop and fix immediately
  on any red.
uses: production-code
produces: refactored production code; whole suite green
checkpoint:
  type: ask
  blocking: true
  shows: [production-diff]
  prompt: "Production code after refactor — diff, suite green. Close the loop?"
~~~

### finish-loop

~~~entry
id: finish-loop
kind: step
belongs-to: tdd-loop
title: Close the loop
description: >
  Show what was produced — new files, the test list, the whole diff — confirm
  done-when holds, and ask what happens next.
shows: [file-list, full-diff]
checkpoint:
  type: ask
  blocking: true
  prompt: "Use case done: <summary>. Whole suite green. Commit it, or more changes first?"
~~~

### locate-target

~~~entry
id: locate-target
kind: step
title: Locate the module / package / class to work in
description: >
  Find where the work belongs before touching anything. For a new use case this
  is the package to create; for a change it is the existing class and its suite.
produces: the target package and, for changes, the existing test file(s)
checkpoint:
  type: ask
  blocking: true
  prompt: "I'll work in <path>. Right place?"
~~~

### create-empty-package

~~~entry
id: create-empty-package
kind: step
belongs-to: scenario-new-use-case
title: Create the empty target package
description: >
  Create the empty package for the new use case, mirroring the structure of a
  sibling use case unless this one genuinely needs a different convention.
produces: an empty package ready for the suite
~~~

### challenge-the-util

~~~entry
id: challenge-the-util
kind: step
belongs-to: scenario-utils
title: Confirm a util is really the right home
description: >
  Before writing a util, check it does not belong on a domain object or use case,
  and is not already provided by Apache Commons, Vavr, the standard library, or
  the framework in use.
uses: libraries-first
checkpoint:
  type: ask
  blocking: true
  prompt: "This could live as <alternative> instead of a util. Still want a util here?"
~~~

### read-existing-tests

~~~entry
id: read-existing-tests
kind: step
belongs-to: scenario-change-existing-code
title: Read the existing suite first
description: >
  Read the current tests to learn what the code does and the conventions the
  suite follows — naming, given/when/then style, helpers, fixtures.
produces: an understanding of current behaviour and suite conventions
~~~

### check-coverage

~~~entry
id: check-coverage
kind: step
belongs-to: scenario-change-existing-code
title: Check the target is covered before changing it
description: >
  Before changing behaviour, check whether the code path is under test.
produces: a decision on how to proceed when coverage is missing
checkpoint:
  type: ask
  blocking: true
  when: the target code path is not covered by tests
  prompt: >
    <path> isn't covered. Add characterization tests first (separate commit), or
    go straight into the change?
~~~

### restate-current-behaviour

~~~entry
id: restate-current-behaviour
kind: step
belongs-to: scenario-change-existing-code
title: Restate what the code currently does
description: >
  Summarise the current behaviour in the product owner's language. Usually an
  internal step; it becomes a checkpoint only when the behaviour is tangled or
  ambiguous.
checkpoint:
  type: ask
  when: the current behaviour is tangled or ambiguous
  prompt: "Current behaviour as I read it: <summary>. Correct baseline before I change it?"
~~~

### enumerate-cases-from-code

~~~entry
id: enumerate-cases-from-code
kind: step
belongs-to: characterize-loop
title: Read the code to list the cases it already handles
description: >
  Derive the test cases from the existing implementation — branches, guards, edge
  values — not from requirements. Each becomes a failing stub.
produces: one failing stub per observed behaviour path
checkpoint:
  type: ask
  blocking: true
  prompt: "Cases I read out of the code: <list>. Missing any path?"
~~~

### characterize-batch

~~~entry
id: characterize-batch
kind: step
belongs-to: characterize-cycle
title: Lock in current behaviour for a small batch
description: >
  For 2-3 stubs, run the existing code, observe what it actually does, and write an assertion that captures that.
  The test asserts current behaviour, not desired behaviour — if the current behaviour looks wrong, note it, do
  not fix it here.
uses: stub-vs-in-memory
produces: passing characterization tests for the batch
checkpoint:
  type: ask
  blocking: true
  shows: [test-diff]
  prompt: "Batch locked in. Continue?"
~~~

### finish-characterize

~~~entry
id: finish-characterize
kind: step
belongs-to: characterize-loop
title: Close the characterization loop
description: >
  Show the added tests and the files touched, confirm every observed path is covered, surface anything parked
  (other uncovered code, suspected bugs), and get the go-ahead to commit. Sets the session's Next line.
shows: [test-diff, file-list]
checkpoint:
  type: ask
  blocking: true
  prompt: >
    Characterization done: <summary of cases + files>. Parked: <list or none>. Commit these tests as a standalone
    commit, or more first?
~~~

### commit-tests

~~~entry
id: commit-tests
kind: step
belongs-to: characterize-loop
title: Commit the tests on their own
description: >
  Runs only after finish-characterize is approved. The characterization tests land as a standalone commit — never
  folded into an unrelated change.
produces: a separate commit containing only the added tests
~~~

### choose-stack

~~~entry
id: choose-stack
kind: step
belongs-to: bootstrap-module
title: Agree the stack
description: >
  Start from default-stack, resolve every entry to its latest stable version,
  and confirm. Deviations are settled here.
uses: default-stack
checkpoint:
  type: ask
  blocking: true
  prompt: "Proposed stack at latest stable: <list>. Good, or adjust?"
~~~

### create-build

~~~entry
id: create-build
kind: step
belongs-to: bootstrap-module
title: Create the build
description: >
  Set up the build tool (Maven unless the project says otherwise), parent /
  plugin config, Java version, and lombok.config with fluent accessors.
produces: a compiling empty project
~~~

### add-dependencies

~~~entry
id: add-dependencies
kind: step
belongs-to: bootstrap-module
title: Add the agreed dependencies
description: >
  Add only what choose-stack agreed, each at its latest stable version. No
  speculative dependencies.
produces: resolved dependencies, project still compiles
~~~

### scaffold-package-skeleton

~~~entry
id: scaffold-package-skeleton
kind: step
belongs-to: bootstrap-module
title: Lay out the package skeleton
description: >
  Create the top-level package structure from architecture-profile and the
  feature-structure rule — feature packages, shared, core, config — empty but
  present.
uses: [architecture-profile, feature-structure]
checkpoint:
  type: ask
  blocking: true
  prompt: "Package skeleton: <tree>. Matches how you want this module organised?"
~~~

### base-configuration

~~~entry
id: base-configuration
kind: step
belongs-to: bootstrap-module
title: Add baseline configuration
description: >
  The always-needed config: Clock bean, application.yml with env-var secrets,
  Liquibase master changelog, dev profile. Nothing feature-specific.
produces: a runnable module with baseline config
~~~

### pick-first-aggregate

~~~entry
id: pick-first-aggregate
kind: step
belongs-to: bootstrap-module
title: Pick the first aggregate to implement
description: >
  From the event-storming output, choose the aggregate to build first and hand
  its first case to scenario-new-use-case.
checkpoint:
  type: ask
  blocking: true
  prompt: "Event storming gives aggregates <list>. Start with <aggregate> and its <case>?"
~~~

### confirm-conventions

~~~entry
id: confirm-conventions
kind: step
title: Confirm structural conventions before creating classes
description: >
  Before scaffolding a class, settle the structural decisions it forces: which
  layer it belongs to, its package, whether it is a port or an adapter, its name
  per the layer's convention. Decisions already determined by architecture-profile
  or the existing project structure are applied silently; only genuinely open
  ones are raised.
uses: [architecture-profile, feature-structure, naming]
checkpoint:
  type: ask
  blocking: true
  when: a placement / layer / port-vs-adapter / naming decision is not already fixed by the profile or the project
  prompt: >
    About to create <class>. I'd put it in <package> as <layer role>, named
    <name>. Agree, or place it differently?
~~~
