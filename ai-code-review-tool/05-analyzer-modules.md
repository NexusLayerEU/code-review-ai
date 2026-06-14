# AgentReview — Analyzer Modules Specification
## Document 05

---

## Overview

AgentReview uses a layered analysis pipeline. Each layer is a module that can run independently.

```
Layer 1: Static Analyzer   → AST parsing + structural rule matching
Layer 2: Semantic Analyzer → Type resolution + dependency awareness
Layer 3: LLM Judge         → Intent alignment + semantic correctness
```

Layer 3 is specified in doc 06. This document covers Layers 1 and 2.

---

## Layer 1 — Static Analyzer

### Purpose
Fast, deterministic analysis that doesn't require full semantic understanding. Catches structural patterns that are dead giveaways of AI failure modes.

### Implementation

**Language:** Python 3.12 microservice (called via HTTP from the Spring Boot API)

**Why Python:** tree-sitter has the best Python bindings; AST manipulation is idiomatic.

### Module: TreeSitterParser

```python
import tree_sitter_languages  # provides grammars for 100+ languages

class TreeSitterParser:
    def parse(self, code: str, language: str) -> ASTNode:
        """
        Returns a tree-sitter AST.
        Supported languages: python, java, typescript, javascript, go, rust
        """
        
    def extract_imports(self, ast: ASTNode, language: str) -> list[ImportStatement]:
        """
        Returns all import statements with resolved paths.
        """
    
    def extract_functions(self, ast: ASTNode) -> list[FunctionDef]:
        """
        Returns all function/method definitions with their bodies.
        """
    
    def extract_calls(self, ast: ASTNode) -> list[CallExpression]:
        """
        Returns all method/function call expressions.
        """
    
    def extract_tests(self, ast: ASTNode, language: str) -> list[TestFunction]:
        """
        Identifies test functions by convention (test_*, @Test, it(), describe())
        """
    
    def extract_try_catch(self, ast: ASTNode) -> list[TryCatchBlock]:
        """
        Returns all try/catch/except blocks with their handlers.
        """
```

### Module: StaticRuleRunner

```python
class StaticRuleRunner:
    def __init__(self, rules: list[StaticRule]):
        self.rules = rules
    
    def run(self, context: StaticContext) -> list[Finding]:
        findings = []
        for rule in self.rules:
            if context.language in rule.supported_languages:
                result = rule.analyze(context)
                findings.extend(result)
        return self._deduplicate(findings)
    
    def _deduplicate(self, findings: list[Finding]) -> list[Finding]:
        """
        Remove findings at the same line from multiple rules if they are
        the same root cause. Keep highest severity.
        """
```

### Module: ImportResolver

```python
class ImportResolver:
    def __init__(self, version_db: VersionDatabase):
        self.version_db = version_db
    
    def resolve(
        self,
        imports: list[ImportStatement],
        dependencies: dict[str, str],  # package → version
        language: str
    ) -> list[ImportResolution]:
        """
        For each import:
        - Check if top-level package is in dependencies
        - If yes, check if the specific symbol exists in that version
        - Return: RESOLVED | NOT_IN_DEPS | SYMBOL_NOT_FOUND | VERSION_MISMATCH
        """
```

### Module: DuplicationDetector

```python
class DuplicationDetector:
    def detect(self, functions: list[FunctionDef]) -> list[DuplicationFinding]:
        """
        1. Normalize each function body:
           - Replace variable names with their types
           - Normalize whitespace
           - Remove comments
        2. Convert to token sequences
        3. Compute Jaccard similarity between all pairs
        4. Return pairs above threshold (default 0.85)
        5. Include line numbers for both occurrences
        """
```

### Module: TestAnalyzer

```python
class TestAnalyzer:
    def analyze(self, tests: list[TestFunction], all_functions: list[FunctionDef]) -> list[Finding]:
        """
        Runs M1, M2, M3, M4 rules against the test suite.
        
        For M1 (tautology): parses assertion AST to find self-referential expected values
        For M2 (spec-free): counts literal values in expected positions
        For M3 (happy path): counts tests with error/edge case inputs
        For M4 (mock overuse): counts mock declarations vs meaningful assertions
        """
```

---

## Layer 2 — Semantic Analyzer

### Purpose
Deeper analysis that requires understanding types, symbols, and the specific version of libraries installed. More expensive than Layer 1 but still deterministic.

### Language-Specific Sub-Analyzers

Each language has its own semantic analyzer module. They all implement:

```java
public interface SemanticAnalyzer {
    String getLanguage();
    List<Finding> analyze(SemanticContext context);
}
```

### Java Semantic Analyzer

**Uses:** JavaParser (symbol resolution), maven dependency tree

```java
public class JavaSemanticAnalyzer implements SemanticAnalyzer {
    
    // Symbol resolution using JavaParser's SymbolResolver
    // with type solver configured against the actual dependency JARs
    
    public List<Finding> analyze(SemanticContext context) {
        var typeSolver = buildTypeSolver(context.getDependencies());
        var symbolResolver = new JavaSymbolSolver(typeSolver);
        var compilationUnit = parseJava(context.getCode(), symbolResolver);
        
        return List.of(
            analyzeMethodCalls(compilationUnit),   // H2
            analyzeEnumAccess(compilationUnit),    // H3
            analyzeNullSafety(compilationUnit),    // C1, C2
            analyzeAsyncPatterns(compilationUnit), // G4
            analyzeDeprecations(compilationUnit)   // V2
        ).stream().flatMap(List::stream).toList();
    }
    
    private TypeSolver buildTypeSolver(Map<String, String> deps) {
        // Resolves JARs from local Maven cache (~/.m2)
        // Falls back to downloading if not cached
    }
}
```

### TypeScript Semantic Analyzer

**Uses:** TypeScript compiler API via ts-node subprocess

```typescript
// analyzer/typescript/semantic.ts
import * as ts from 'typescript';

export function analyzeTypeScript(context: SemanticContext): Finding[] {
    const program = ts.createProgram(context.files, {
        strict: true,
        noImplicitAny: true,
        target: ts.ScriptTarget.ES2022
    });
    
    const checker = program.getTypeChecker();
    const findings: Finding[] = [];
    
    // H2: Hallucinated method calls
    findings.push(...detectHallucinatedMethods(program, checker));
    
    // C4: Silent type coercions
    findings.push(...detectImplicitCoercions(program, checker));
    
    // V1/V2: Version-inappropriate API usage
    findings.push(...detectVersionIssues(program, checker, context.dependencies));
    
    return findings;
}
```

### Python Semantic Analyzer

**Uses:** Python `ast` module + `importlib` + `inspect`

```python
class PythonSemanticAnalyzer:
    def analyze(self, context: SemanticContext) -> list[Finding]:
        tree = ast.parse(context.code)
        
        findings = []
        findings += self._check_attribute_access(tree, context)  # H2
        findings += self._check_none_guards(tree)                 # C1
        findings += self._check_sequence_access(tree)             # C2
        findings += self._check_async_patterns(tree)              # G4
        
        return findings
    
    def _check_attribute_access(self, tree, context):
        """
        Resolve attribute access against actual imported symbols.
        Uses importlib to load the actual module and inspect its members.
        Safe: runs in a subprocess with timeout.
        """
```

---

## Version Database

Both layers reference a centralized version database:

### Schema
```sql
CREATE TABLE api_symbols (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    package_name VARCHAR(255) NOT NULL,
    package_version VARCHAR(50) NOT NULL,
    language VARCHAR(20) NOT NULL,
    symbol_path VARCHAR(500) NOT NULL,  -- e.g. org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
    symbol_type VARCHAR(50),           -- CLASS, METHOD, FIELD, ENUM_VALUE
    introduced_in VARCHAR(50),
    deprecated_in VARCHAR(50),
    removed_in VARCHAR(50),
    replacement VARCHAR(500),
    INDEX idx_package_version (package_name, package_version),
    INDEX idx_symbol (symbol_path)
);
```

### Seed Data Priority (launch)

For Spring Boot:
- Spring Boot 2.7 → 3.0 migration breaking changes (full list from Spring docs)
- Spring Security 5 → 6 API changes
- Spring Data JPA method signature changes

For Java:
- Java 8, 11, 17, 21 API additions (key stdlib classes)
- Removed APIs: `sun.*`, deprecated `Date` constructors, etc.

For React:
- React 16, 17, 18 lifecycle and hook API changes

### Update Mechanism
```
POST /api/version-db/update
{
  "package": "org.springframework.boot",
  "version": "3.3.0",
  "symbols": [...]
}
```

---

## Analyzer Orchestration

The `ReviewOrchestrator` in Spring Boot:

```java
@Service
public class ReviewOrchestrator {
    
    public ReviewReport review(ReviewRequest request) {
        var findings = new ArrayList<Finding>();
        
        // Layer 1: always runs
        var staticFindings = staticAnalyzerClient.analyze(request);
        findings.addAll(staticFindings);
        
        // Layer 2: if language supported and mode != static_only
        if (semanticAnalyzers.containsKey(request.getLanguage()) 
            && request.getMode() != STATIC_ONLY) {
            var semanticContext = buildSemanticContext(request, staticFindings);
            var semanticFindings = semanticAnalyzers.get(request.getLanguage())
                                                    .analyze(semanticContext);
            findings.addAll(semanticFindings);
        }
        
        // Layer 3: if mode == full OR ambiguous findings exist
        boolean hasAmbiguousFindings = findings.stream()
            .anyMatch(f -> f.getConfidence() == LOW);
        if (request.getMode() == FULL || hasAmbiguousFindings) {
            var llmFindings = llmJudge.judge(request, findings);
            findings.addAll(llmFindings);
        }
        
        return reportBuilder.build(request, deduplicate(findings));
    }
}
```
