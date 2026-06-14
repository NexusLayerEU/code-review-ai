# AgentReview — AI Code Failure Taxonomy
## Document 03

> This is the intellectual foundation of AgentReview. Every rule in the rule engine maps to a category here. Every LLM judge prompt references this taxonomy.

---

## Overview

AI-generated code fails in **8 fundamental categories**, distinct from human failure patterns.

| ID | Category | Description | Detectability |
|---|---|---|---|
| H | HALLUCINATION | References to things that don't exist | Static (Layer 1) |
| I | INTENT_DRIFT | Code solves a different problem than stated | LLM Judge (Layer 3) |
| M | MIRROR_TEST | Tests that copy implementation instead of verifying behavior | Static + Semantic |
| A | ABSTRACTION_SMELL | Fake modularity that hides rather than organizes | Semantic (Layer 2) |
| C | CONFIDENCE_BUG | Plausible but wrong assumptions stated as certainty | LLM Judge (Layer 3) |
| D | DEAD_REPLICA | Duplicated logic the agent didn't notice it already wrote | Static (Layer 1) |
| V | VERSION_BLIND | API usage incompatible with installed dependency versions | Semantic (Layer 2) |
| G | GHOST_HANDLING | Error handling that looks complete but does nothing | Static + Semantic |

---

## H — HALLUCINATION

The agent referenced something that does not exist.

### H1 — Hallucinated Import / Dependency
**What:** Agent imports a class, module, or package that does not exist in the declared dependencies.
**Why AI does this:** Training data contained many similar packages; the agent blends them.
**Example:**
```python
from anthropic.tools import ToolRegistry  # ToolRegistry does not exist in anthropic SDK
```
**Detection:** Cross-reference all imports against installed packages + their exported symbols.

### H2 — Hallucinated Method / Property
**What:** Agent calls a method or accesses a property that does not exist on the type.
**Why AI does this:** The agent "knows" the class conceptually and invents a method that sounds right.
**Example:**
```java
user.getFullName()  // User class only has getFirstName() and getLastName()
```
**Detection:** Symbol resolution against actual class definitions.

### H3 — Hallucinated Constant / Enum Value
**What:** Agent uses an enum value or constant that doesn't exist.
**Example:**
```typescript
HttpStatus.RATE_LIMITED  // Does not exist; correct is HttpStatus.TOO_MANY_REQUESTS
```
**Detection:** Enum member resolution.

### H4 — Hallucinated Config Key
**What:** Agent references a configuration property key that the application doesn't define.
**Example:**
```yaml
spring.datasource.connection-pool-size: 10  # key doesn't exist in Spring Boot
```
**Detection:** Cross-reference against known config schemas.

---

## I — INTENT_DRIFT

The code is valid but solves a subtly or completely different problem than described.

### I1 — Scope Creep
**What:** Agent implemented more than requested, adding logic not in the task.
**Why AI does this:** Agents try to be helpful and fill in what they think was implied.
**Example:** Task: "Add a user lookup by email." Agent: Added email lookup + password reset + audit logging.
**Detection:** LLM judge compares task description to code diff scope.

### I2 — Requirement Inversion
**What:** Agent implemented the opposite of what was asked.
**Example:** Task: "Return 404 when user not found." Agent returns 200 with null body.
**Detection:** LLM judge with explicit requirement parsing.

### I3 — Wrong Entity
**What:** Agent applied correct logic to the wrong entity/table/field.
**Example:** Task was about `Order` but agent modified `Invoice` because they're similar.
**Detection:** LLM judge cross-referencing entity names in task vs. code.

### I4 — Partial Implementation
**What:** Agent implemented part of the task and silently omitted the rest, with no indication.
**Why AI does this:** Agents don't always signal when they stop.
**Detection:** LLM judge checking task completeness.

---

## M — MIRROR_TEST

Tests that structurally mirror the implementation instead of verifying behavior against a specification.

### M1 — Implementation Echo
**What:** Test calls the implementation and asserts it returns what the implementation returns — not what it *should* return.
**Why AI does this:** The agent generates tests after generating code; it tests what it built.
**Example:**
```python
def test_calculate_tax():
    result = calculate_tax(100, 0.2)
    # Agent wrote both calculate_tax and this test
    assert result == calculate_tax(100, 0.2)  # tautology
```
**Detection:** Identify tests where expected value is derived by calling the function under test.

### M2 — Spec-Free Test
**What:** Test has no hardcoded expected values — all assertions are relational or derived.
**Example:**
```typescript
expect(result).toBeDefined()
expect(result.length).toBeGreaterThan(0)
// Never: expect(result).toEqual([{ id: 1, name: 'Alice' }])
```
**Detection:** Tests with zero literal expected values are flagged.

### M3 — Happy Path Only
**What:** Agent only tests the successful case, never edge cases, errors, or boundaries.
**Detection:** Flag test files where 100% of tests use valid inputs and expect success.

### M4 — Mocked Into Irrelevance
**What:** Agent mocks so much of the dependency tree that the unit under test does nothing real.
**Example:** Every external call is mocked, the unit just routes, but the test "passes" with full coverage.
**Detection:** Test files where mock count ≥ actual assertion count.

---

## A — ABSTRACTION_SMELL

Modularity that looks clean but is semantically wrong.

### A1 — Single-Use Abstraction
**What:** Agent creates a class or interface used in exactly one place with one implementation.
**Why AI does this:** Training data rewards "good OOP" so the agent creates abstractions as a reflex.
**Detection:** Interfaces with single implementations; classes instantiated in one place only.

### A2 — Semantic Mismatch
**What:** Abstraction name implies one thing; implementation does another.
**Example:** Class `CacheManager` that only reads from cache and never writes.
**Detection:** LLM judge comparing name to implementation.

### A3 — Hidden Logic Abstraction
**What:** Agent buries critical business logic inside a utility method named innocuously.
**Example:** `StringUtils.normalize()` that actually applies tax rounding rules.
**Detection:** LLM judge flagging business logic found in utility/helper layers.

### A4 — Indirection Without Value
**What:** Multiple layers of delegation with no added logic at any layer.
**Example:** `Controller → Service → Repository → DAO` where Service and DAO are pass-throughs.
**Detection:** Methods that only delegate without adding logic, branching, or transformation.

---

## C — CONFIDENCE_BUG

Agent states an assumption as fact with no validation.

### C1 — Missing Null Guard
**What:** Agent accesses a property on an object that could be null/undefined, with no check.
**Why AI does this:** In the "happy path" the agent is imagining, the object exists.
**Detection:** Property access on types that include null/undefined without prior null check.

### C2 — Assumed Collection Size
**What:** Agent accesses index `[0]` or `.first()` on a collection without checking it's non-empty.
**Detection:** Unchecked first-element access.

### C3 — Wrong Default Assumption
**What:** Agent assumes a default value that is wrong for the domain.
**Example:** `timeout = 30` (seconds) in a context where the standard is milliseconds.
**Detection:** LLM judge comparing constants to domain norms described in context.

### C4 — Silent Type Coercion
**What:** Agent relies on implicit type coercion that could produce wrong results silently.
**Example (JavaScript):** `"5" + 2 === "52"` used in arithmetic context.
**Detection:** Implicit coercion patterns in dynamically typed languages.

---

## D — DEAD_REPLICA

Agent introduces logic it already wrote elsewhere without noticing.

### D1 — Logic Duplication
**What:** Same algorithm or transformation written twice in different places.
**Why AI does this:** Agent doesn't maintain a mental model of what it already wrote; each section is generated fresh.
**Detection:** Semantic similarity comparison between code blocks (not just string match).

### D2 — Shadowed Variable
**What:** Agent declares a variable with the same name as an outer-scope variable, shadowing it.
**Detection:** Variable scope analysis.

### D3 — Dead Import
**What:** Agent imports a symbol it never uses (often left from a previous generation pass).
**Detection:** Import usage analysis.

### D4 — Orphaned Function
**What:** Agent defines a helper function that is never called.
**Detection:** Call graph analysis.

---

## V — VERSION_BLIND

Agent uses API that exists in one version but not the installed version.

### V1 — API Added in Later Version
**What:** Agent uses a method/class introduced in a version newer than what's installed.
**Example:** Uses Java 21 `SequencedCollection` in a Java 17 project.
**Detection:** Cross-reference API usage against declared dependency versions.

### V2 — Deprecated API
**What:** Agent uses an API that was deprecated or removed in the installed version.
**Example:** Uses Spring Boot 2 `WebSecurityConfigurerAdapter` in a Spring Boot 3 project.
**Detection:** Deprecated API registry per language/framework.

### V3 — Breaking Change Blindness
**What:** Agent uses an API that changed signature in a major version.
**Example:** Agent uses old Lombok `@Builder` behavior that changed in v1.18.x.
**Detection:** Known breaking change registry.

---

## G — GHOST_HANDLING

Error handling that is present but non-functional.

### G1 — Swallowed Exception
**What:** Agent catches an exception and does nothing (or just logs it) while execution continues as if success.
**Example:**
```java
try {
    saveUser(user);
} catch (Exception e) {
    log.error("Failed", e);
    // execution continues; caller receives success response
}
```
**Detection:** Catch blocks with no rethrow, no return of error state, no propagation.

### G2 — Incorrect Error Propagation
**What:** Agent wraps one error type in another that loses information.
**Example:** Catches `SQLException`, wraps in generic `RuntimeException`, loses the SQL error code.
**Detection:** Exception wrapping patterns that discard the original exception or its fields.

### G3 — Unreachable Error Path
**What:** Agent writes error handling code that can never execute.
**Example:** null check after the null-dereference that would have already thrown.
**Detection:** Control flow analysis.

### G4 — Optimistic Async
**What:** Agent fires async operation with no error handler.
**Example:** `CompletableFuture.runAsync(() -> doSomething())` with no `.exceptionally()`.
**Detection:** Async call patterns without error callbacks.

---

## Severity Mapping

| Category | Default Severity | Rationale |
|---|---|---|
| H1, H2 | CRITICAL | Will crash at runtime |
| H3, H4 | HIGH | Will crash or behave wrong |
| I1, I2, I3 | HIGH | Wrong feature was built |
| I4 | MEDIUM | Feature is incomplete |
| M1 | HIGH | Tests provide false confidence |
| M2, M3 | MEDIUM | Tests miss failure modes |
| M4 | LOW | Weak coverage |
| A1, A4 | LOW | Complexity without value |
| A2, A3 | HIGH | Misleading structure hides bugs |
| C1, C2 | HIGH | Runtime crashes |
| C3, C4 | MEDIUM | Silent wrong behavior |
| D1, D2 | MEDIUM | Maintenance debt |
| D3, D4 | LOW | Dead code |
| V1, V2 | CRITICAL | Won't compile or run |
| V3 | HIGH | Silent behavior change |
| G1 | HIGH | Error masking |
| G2, G3 | MEDIUM | Incorrect error info |
| G4 | MEDIUM | Silent async failure |
