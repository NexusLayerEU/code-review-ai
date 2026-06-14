# AgentReview — Rule Engine Specification
## Document 04

---

## Overview

The Rule Engine is the central component that maps code patterns to findings from the AI Failure Taxonomy (doc 03). It is a registry of rules where each rule is:

1. A metadata definition (id, name, category, severity, languages)
2. A detector — a function that inspects AST nodes or text and returns a Finding or null

---

## Rule Interface

### Java Interface
```java
public interface ReviewRule {
    String getId();           // e.g. "H1_HALLUCINATED_IMPORT"
    String getName();         // Human label
    FailureCategory getCategory(); // from taxonomy
    Severity getDefaultSeverity();
    Set<Language> getSupportedLanguages();
    
    /**
     * Analyze the given review context and return findings.
     * Return empty list if no issues found.
     */
    List<Finding> analyze(RuleContext context);
}
```

### RuleContext
```java
public record RuleContext(
    String code,
    String language,
    ASTNode ast,              // parsed AST from tree-sitter
    Map<String, String> imports,       // resolved imports
    Map<String, String> dependencies,  // declared deps with versions
    Map<String, ClassSymbol> symbolTable, // resolved class symbols
    String taskDescription,
    List<Finding> priorFindings  // findings from earlier layers
) {}
```

---

## Built-In Rules

### HALLUCINATION Rules

#### H1 — AI_HALLUCINATED_IMPORT
```
ID: AI_H1_HALLUCINATED_IMPORT
Category: HALLUCINATION
Severity: CRITICAL
Languages: Python, TypeScript, Java

Algorithm:
  1. Extract all import statements from the AST
  2. For each import:
     a. Resolve the top-level package against declared dependencies
     b. If top-level package not in deps → Finding(CRITICAL, "Package not declared")
     c. If package is declared, resolve sub-path against known exports for that package version
     d. If sub-path not in known exports → Finding(HIGH, "Symbol does not exist in package@version")
  3. Known exports database: loaded from a bundled registry + updatable via API

Special case: if dependency version is not declared (e.g. "latest"), downgrade to HIGH/MEDIUM.
```

#### H2 — AI_HALLUCINATED_METHOD
```
ID: AI_H2_HALLUCINATED_METHOD
Category: HALLUCINATION
Severity: CRITICAL
Languages: Python, TypeScript, Java

Algorithm:
  1. Build symbol table from all class definitions in the review context
  2. For every method call expression in the AST:
     a. Resolve the receiver type
     b. Look up the method name in the symbol table for that type
     c. If not found → Finding(CRITICAL, "Method does not exist on type")
  3. Exclude: dynamic dispatch, reflection, any(), unknown types
  4. Include: strongly typed receivers only
```

#### H3 — AI_HALLUCINATED_ENUM
```
ID: AI_H3_HALLUCINATED_ENUM
Category: HALLUCINATION
Severity: HIGH
Languages: Python, TypeScript, Java

Algorithm:
  1. Find all enum type accesses (EnumType.VALUE pattern)
  2. For each: resolve the enum definition (local or from dependencies)
  3. If the accessed member is not in the definition → Finding
```

---

### MIRROR_TEST Rules

#### M1 — AI_MIRROR_TEST_TAUTOLOGY
```
ID: AI_M1_TAUTOLOGY
Category: MIRROR_TEST
Severity: HIGH
Languages: Python, TypeScript, Java

Algorithm:
  1. Find all test functions/methods (decorated with @test, named test_*, etc.)
  2. For each test:
     a. Find assertion statements
     b. For each assertion: check if the expected value expression contains
        a call to the function under test
     c. Pattern: assert result == function_under_test(same_args) → TAUTOLOGY
     d. Pattern: expect(fn()).toEqual(fn()) → TAUTOLOGY
  3. Severity: HIGH (this test can never catch bugs)
```

#### M2 — AI_SPEC_FREE_TEST
```
ID: AI_M2_SPEC_FREE
Category: MIRROR_TEST
Severity: MEDIUM
Languages: Python, TypeScript, Java

Algorithm:
  1. Find all test functions
  2. For each test:
     a. Count literal values in assertion expected positions
        (string literals, number literals, boolean literals, object literals)
     b. Count relational assertions (toBeDefined, toBeNull, toBeGreaterThan, etc.)
  3. If literal_count == 0 AND relational_count > 0 → Finding(MEDIUM)
  4. Note: Some relational assertions are fine; trigger only when 100% relational
```

#### M3 — AI_HAPPY_PATH_ONLY
```
ID: AI_M3_HAPPY_PATH
Category: MIRROR_TEST
Severity: MEDIUM
Languages: Python, TypeScript, Java

Algorithm:
  1. Find all test files
  2. For each test file:
     a. Count tests that use try/catch, assertThrows, pytest.raises, etc.
     b. Count tests with negative/edge-case inputs (null, 0, -1, "", [], etc.)
     c. Total test count in file
  3. If (error_tests + edge_tests) / total < 0.1 (less than 10%) → Finding(MEDIUM)
     "Test suite has no error or edge case coverage"
```

#### M4 — AI_MOCK_OVERUSE
```
ID: AI_M4_MOCK_OVERUSE
Category: MIRROR_TEST
Severity: LOW
Languages: Python, TypeScript, Java

Algorithm:
  1. Find all test files
  2. For each test:
     a. Count mock/stub/spy declarations
     b. Count meaningful assertions (excluding toBeCalled/toHaveBeenCalled)
  3. If mock_count > assertion_count * 2 → Finding(LOW)
```

---

### GHOST_HANDLING Rules

#### G1 — AI_SWALLOWED_EXCEPTION
```
ID: AI_G1_SWALLOWED
Category: GHOST_HANDLING
Severity: HIGH
Languages: Python, TypeScript, Java

Algorithm:
  1. Find all try/catch blocks
  2. For each catch block:
     a. Check if block contains: throw, return (with error indicator), 
        propagation of exception, response.setError(), result.fail()
     b. If catch block only contains: logging statements, empty body,
        or sets a local variable that is never checked → Finding(HIGH)
  3. Pattern: catch(e) { log.error(e); } followed by success path → CRITICAL
```

#### G4 — AI_OPTIMISTIC_ASYNC
```
ID: AI_G4_OPTIMISTIC_ASYNC
Category: GHOST_HANDLING
Severity: MEDIUM
Languages: TypeScript, Java

Algorithm:
  TypeScript:
    1. Find all Promise-returning calls, async calls
    2. Check for .catch(), .finally(), try/await/catch
    3. Flag unhandled promise chains
  Java:
    1. Find CompletableFuture.runAsync, supplyAsync patterns
    2. Check for .exceptionally(), .handle(), .whenComplete()
    3. Flag futures with no error handler
```

---

### DEAD_REPLICA Rules

#### D1 — AI_LOGIC_DUPLICATION
```
ID: AI_D1_DUPLICATION
Category: DEAD_REPLICA
Severity: MEDIUM
Languages: All

Algorithm:
  1. Extract all function/method bodies as normalized token sequences
     (variable names replaced with types, whitespace normalized)
  2. Compute pairwise similarity using token-level Jaccard similarity
  3. Pairs with similarity > 0.85 and length > 5 lines → Finding(MEDIUM)
  4. Include cross-file comparison for multi-file reviews
```

#### D3 — AI_DEAD_IMPORT
```
ID: AI_D3_DEAD_IMPORT
Category: DEAD_REPLICA
Severity: LOW
Languages: Python, TypeScript, Java

Algorithm:
  1. Collect all imports
  2. Build usage index: for each identifier in non-import code, record its name
  3. For each import: check if the imported symbol appears in the usage index
  4. If not found → Finding(LOW)
  Note: Wildcard imports (import *) are excluded
```

---

### VERSION_BLIND Rules

#### V1 — AI_VERSION_FUTURE_API
```
ID: AI_V1_FUTURE_API
Category: VERSION_BLIND
Severity: CRITICAL
Languages: Python, TypeScript, Java

Algorithm:
  1. Load declared dependency versions from package.json / pom.xml / requirements.txt
  2. For each import/usage of a known library:
     a. Look up the API element (class, method, annotation) in the version database
     b. Check: "introduced_in_version" <= installed_version
     c. If introduced_in_version > installed_version → Finding(CRITICAL)
  3. Version database: bundled JSON files per major library, updatable via API
  
Known entries to include at launch:
  Java: Spring Boot 2→3 breaking changes, Java 8/11/17/21 API additions
  TypeScript: Node.js built-in additions, React 16/17/18 API changes
  Python: Python 3.8–3.12 stdlib additions
```

#### V2 — AI_DEPRECATED_API
```
ID: AI_V2_DEPRECATED
Category: VERSION_BLIND
Severity: HIGH
Languages: Python, TypeScript, Java

Algorithm:
  Same as V1 but checks "deprecated_in_version" and "removed_in_version"
  
Priority deprecated APIs for Spring Boot 3:
  - WebSecurityConfigurerAdapter (removed)
  - @EnableWebSecurity on non-config class
  - spring.security.oauth2.* old property paths
```

---

## Custom Rules

Custom rules can be defined via the API in a JSON DSL:

```json
{
  "id": "CUSTOM_MY_COMPANY_001",
  "name": "No Direct Database Calls in Controllers",
  "category": "ABSTRACTION_SMELL",
  "severity": "HIGH",
  "languages": ["java"],
  "pattern_type": "AST_PATH",
  "pattern": {
    "node_type": "MethodCall",
    "in_class_annotation": "@RestController",
    "callee_type_matches": ".*Repository|.*JdbcTemplate"
  },
  "message": "Controllers must not call repositories directly. Use a service layer."
}
```

Supported `pattern_type` values:
- `AST_PATH` — match by AST node type and attributes
- `REGEX` — regex over raw code (use sparingly; low precision)
- `IMPORT_PRESENT` — trigger if a specific import is present
- `LLM_PROMPT` — delegate to LLM with a custom prompt

---

## Rule Configuration

Rules can be configured per project:

```yaml
# agentreview.yml
rules:
  AI_M4_MOCK_OVERUSE:
    enabled: false
  AI_D1_DUPLICATION:
    severity: LOW      # downgrade from MEDIUM
    threshold: 0.92    # raise similarity threshold
  AI_H1_HALLUCINATED_IMPORT:
    enabled: true
    
thresholds:
  block_on_severity: HIGH   # any HIGH or CRITICAL blocks the review
  warn_on_severity: MEDIUM
```
