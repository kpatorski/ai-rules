# Java Backend Rules

Rules derived from the Votify and Deskify backend projects.
These rules apply to all Java backend services in this workspace.

---

## Tech Stack

**Required versions:**
- Java 21
- Spring Boot 3.4.x (use `spring-boot-starter-parent` as Maven parent)
- Lombok 1.18.x
- Liquibase 4.29.x
- PostgreSQL driver (runtime scope)
- `online.goodcode:result:1.0.0` — Result monad for error handling

**Required Spring Boot starters:**
- `spring-boot-starter-web`
- `spring-boot-starter-data-jpa` or direct JDBC (`spring-boot-starter-jdbc`)
- `spring-boot-starter-validation`

**Testing stack:**
- Spock 2.4+ with Groovy 4.x (primary test framework)
- JUnit Jupiter (for TestContainers integration only)
- TestContainers with PostgreSQL module (integration tests)
- REST-Assured (HTTP-level integration tests)
- AssertJ (assertions)

---

## Lombok Configuration

Every project MUST have a `lombok.config` at the root with:

```properties
lombok.accessors.fluent=true
lombok.copyableAnnotations+=org.springframework.beans.factory.annotation.Qualifier
lombok.copyableAnnotations+=org.springframework.beans.factory.annotation.Value
```

Fluent accessors are mandatory — use `.id(value)` not `.setId(value)`.

Always inject Spring beans via `@RequiredArgsConstructor(access = AccessLevel.PACKAGE)` on service/use-case classes. Never use field injection (`@Autowired`).

---

## Package Structure

Organize by feature (use case), not by technical layer.

```
com.<app>/
├── <domain>/
│   ├── <usecase1>/          ← self-contained use case
│   │   ├── entrypoint/      ← HTTP controller only
│   │   ├── db/              ← repository implementation
│   │   └── events/          ← domain events for this use case
│   └── <usecase2>/
├── query/                   ← read models, separated from commands
│   └── <queryname>/
│       ├── admin/
│       └── resident/
├── shared/                  ← cross-cutting abstractions
│   ├── event/               ← Event interface, EventPublisher
│   ├── result/              ← Failure, NotFoundFailure
│   └── entrypoint/          ← SuccessResponse, FailureResponse
├── core/                    ← value objects, specifications
└── config/                  ← Spring @Configuration classes
```

Each use case package is fully self-contained: its own entity representations, repositories, and events. Two use cases MUST NOT share entity classes even if they map to the same table.

---

## Use Case Structure

Every operation follows this four-part pattern:

**1. Entrypoint** (`*Entrypoint`, `@RestController`)
- Maps HTTP request to a command record
- Calls the use case, maps `Result` to `ResponseEntity`
- Contains zero business logic

**2. Use case class** (verb-noun name, `@Service`)
- Named after the operation: `CreateReservation`, `VoteForResolution`, `AddDeskToWorkplace`
- Takes a command, returns `Result<SuccessEvent, Failure>`
- Injects repositories/gateways via package-private constructor
- Publishes events on success

**3. Repository interface** (domain layer) + **implementation** (`db/` subpackage)
- Interface contains domain-language methods returning `Result<T, Failure>`
- Implementation is `@Repository("qualifiedName")` and uses JPA or JDBC
- Never expose raw JPA/JDBC types through the interface

**4. Domain entity**
- Package-private visibility
- Business methods return `Result<Event, Failure>` — never void or throws
- Static factory methods for construction (e.g., `Resolution.create(...)`)
- Builder via `@Builder` for complex construction

Example naming:
```java
// Entrypoint
@RestController class VoteForResolutionEntrypoint { ... }

// Use case
@Service class VoteForResolution { ... }

// Repository interface (domain)
interface ResolutionRepository { Result<Resolution, Failure> fetchById(UUID id); }

// Repository implementation (db/)
@Repository("voteForResolutionResolutionRepository")
class DatabaseResolutionRepository implements ResolutionRepository { ... }
```

---

## Result Monad

Use `Result<S, F extends Failure>` from `online.goodcode:result` everywhere.

**Never throw exceptions for business failures.** Return `Result.failure(...)` instead.

**Failure types:**
```java
// Base — maps to HTTP 400
interface Failure {
    String message();
}

// Maps to HTTP 404
interface NotFoundFailure extends Failure {}
```

Failures are lambdas or anonymous implementations — not full classes:
```java
// Good
Result.failure((NotFoundFailure) () -> "Resolution[%s] not found".formatted(id))

// Avoid
class ResolutionNotFoundFailure implements NotFoundFailure { ... } // only when reused
```

**Chaining:**
```java
repository.fetchById(id)
    .flatSuccess(resolution -> resolution.vote(clock, command))
    .ifSuccess(event -> eventPublisher.publish(event))
    .ifFailure(failure -> log.warn("Vote failed: {}", failure.message()))
```

**HTTP mapping via `SuccessResponse` / `FailureResponse`:**
```java
return result.get(
    event  -> SuccessResponse.created(event),
    failure -> FailureResponse.of(failure)   // auto 404 if NotFoundFailure
);
```

---

## Domain Events

**Event interface:**
```java
interface Event {
    String payload();
    default Instant timestamp() { return Instant.now(); }
}
```

Events are **records** that implement `Event`:
```java
record UserVotedForResolution(UUID resolutionId, UUID residentId, VoteOption vote)
    implements Event {
    public String payload() { return /* JSON or toString */ }
}
```

**Publishing:**
- Inject `EventPublisher` (not Spring's `ApplicationEventPublisher` directly)
- Use `@EventListener` for side-effect handlers (audit log, projections, triggered use cases)
- Aggregates that own events collect them internally; repositories dequeue and publish after save

---

## Entities & Persistence

**Entity visibility:**
- Entity classes are package-private (no `public` modifier)
- Multiple use cases mapping the same table use distinct `@Entity(name = "...")` names

**JPA configuration:**
```yaml
spring:
  jpa:
    hibernate:
      ddl-auto: none       # Always. Schema is managed by Liquibase only.
    show-sql: false
    properties:
      hibernate:
        format_sql: true
```

**Liquibase:**
- All schema changes go through Liquibase changesets
- Master changelog: `classpath:db/changelog/db.changelog-master.yml`
- Organize changesets by version in numbered subfolders: `1-0-0/`, `1-1-0/`
- Use `contexts: prod` in production; `dev` context for seed/dev-only data
- Never use `hibernate.ddl-auto: create` or `update` — not even in tests

**Repository pattern:**
- Provide a domain-language interface, hide Spring Data / JDBC implementation
- Default methods on `JpaRepository` interfaces may return `Result<T, Failure>`:
```java
interface ResolutionRepository extends JpaRepository<Resolution, UUID> {
    default Result<Resolution, Failure> fetchById(UUID id) {
        return findById(id)
            .map(Result::<Resolution, Failure>success)
            .orElseGet(() -> Result.failure((NotFoundFailure) () -> "Resolution not found"));
    }
}
```

**When using raw JDBC** (prefer for complex queries):
- Use named parameters (`:name`), never positional `?`
- Use the current Spring JDBC API for the project's Spring version, checked in its docs, not recalled from memory:
  `JdbcClient` since Spring 6.1, `NamedParameterJdbcTemplate` before that
- SQL as named `private static final String` constants on the repository class
- Map rows to domain DTOs, not directly to entity classes

---

## Clock Abstraction

Never call `Instant.now()` or `LocalDate.now()` directly in business logic.

Inject a `Clock` bean:
```java
@Configuration
class ClockConfiguration {
    @Bean Clock clock() { return Clock.systemUTC(); }
}
```

Pass `Clock` into domain methods so tests can control time without mocking system calls.

---

## Specifications

For explicit, composable business rules use the Specification pattern:

```java
// Single-parameter
interface Specification<T> {
    boolean isSatisfiedBy(T candidate);
    default Specification<T> and(Specification<T> other) { ... }
    default Specification<T> or(Specification<T> other) { ... }
    default Specification<T> not() { ... }
}

// Two-parameter
interface BiSpecification<T, O> {
    boolean isSatisfiedBy(T first, O second);
}
```

Implement as `@Service` beans. Name after the business rule:
```java
@Service class IsDeskAvailableInCycle implements BiSpecification<Desk, BookingCycle> { ... }
@Service class IsBookingCycleNotStarted implements Specification<BookingCycle> { ... }
```

---

## Naming Conventions

| Concept | Convention | Example |
|---|---|---|
| Use case / command handler | Verb-noun | `AddDeskToWorkplace`, `VoteForResolution` |
| HTTP controller | `*Entrypoint` | `VoteForResolutionEntrypoint` |
| Repository interface | `*Repository` | `ResolutionRepository` |
| Repository implementation | `Database*Repository` | `DatabaseResolutionRepository` |
| Domain events | Past-tense record | `UserVotedForResolution`, `DeskAddedToWorkplace` |
| Failures | `*Failure` record | `WorkplaceDoesNotExistFailure` |
| Commands | `*Command` record | `VoteForResolutionCommand` |
| Specifications | Is/Has + description | `IsDeskAvailableInCycle` |
| DB qualifier | fully qualified use-case prefix | `"voteForResolutionResolutionRepository"` |

---

## Testing Conventions

**Use Spock (Groovy) as the primary test framework.** JUnit is only for TestContainers bootstrap.

**Unit tests:**
- Replace repositories with in-memory implementations (HashMap-backed)
- Mock only external boundaries: `EventPublisher`, HTTP clients, clocks (via injected `Clock`)
- Structure: `given` / `when` / `then` blocks with `verifyAll` for multiple assertions
- Test through the use case class, not through the HTTP entrypoint
- One Spock `Specification` per use case

**Test naming — Spock string method names:**
```groovy
def "reservation is rejected when desk is already booked"() { ... }
def "vote is rejected after deadline"() { ... }
def "next booking cycle is created before current cycle ends"() { ... }
```

**Integration tests:**
- Extend a shared `IntegrationTest` base class annotated with `@SpringBootTest` + `@Testcontainers`
- Use a single static PostgreSQL `TestContainers` container shared across tests
- Set `spring.datasource.url` via `@DynamicPropertySource`
- Use REST-Assured for full HTTP round-trips
- Integration tests cover the full stack: HTTP → use case → DB → response

**Fixtures:**
```groovy
static def aValidDesk() { new Desk(DeskId.generate(), "Standing Desk", true) }
static def aBookingCycleInProgress() { ... }
```

---

## Application Configuration

**Environment variables for secrets** — never hardcode:
```yaml
spring:
  datasource:
    url: ${DATASOURCE_URL}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
server:
  port: ${PORT:8080}
```

**Profile convention:**
- `application.yml` — production defaults
- `application-dev.yml` — local development overrides (localhost DB, dev Liquibase context)

**OpenAPI (Swagger):**
- Include `springdoc-openapi-starter-webmvc-ui`
- Annotate controllers with `@Tag`, `@Operation`, `@ApiResponse`
- Available at `/swagger-ui.html` in dev
