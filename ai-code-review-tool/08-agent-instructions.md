# AgentReview — Autonomous Build Instructions
## Document 08 — Agent Entry Point

> **READ THIS FIRST.** This is the primary entry point for a coding agent building AgentReview. Follow sections in order. Reference other documents in the package as directed.

---

## Your Mission

Build `AgentReview` — a code review system purpose-built for AI-generated code. You are building a tool that will review code written by agents like yourself. This is a production-quality service, not a prototype.

Before writing any code, read all documents in this package:
- `00-README.md` — what this is
- `01-product-spec.md` — what to build and why
- `02-architecture.md` — how it fits together
- `03-ai-failure-taxonomy.md` — the failure categories (intellectual core)
- `04-rule-engine-spec.md` — the rule definitions
- `05-analyzer-modules.md` — static and semantic analyzers
- `06-llm-judge-spec.md` — LLM judge layer
- `07-api-spec.md` — REST API contract

---

## Phase 1 — Project Scaffolding

### 1.1 — Create the Maven project structure

```
agentreview/
├── api/                          # Spring Boot 3 REST API
│   ├── src/main/java/eu/nexuslayer/agentreview/
│   │   ├── AgentReviewApplication.java
│   │   ├── controller/
│   │   │   └── ReviewController.java
│   │   ├── service/
│   │   │   ├── ReviewOrchestrator.java
│   │   │   ├── ReportBuilder.java
│   │   │   └── AnalyticsService.java
│   │   ├── rule/
│   │   │   ├── ReviewRule.java          (interface)
│   │   │   ├── RuleEngine.java
│   │   │   ├── RuleRegistry.java
│   │   │   └── builtin/
│   │   │       ├── H1HallucinatedImportRule.java
│   │   │       ├── M1TautologyTestRule.java
│   │   │       ├── G1SwallowedExceptionRule.java
│   │   │       └── ... (one file per rule)
│   │   ├── analyzer/
│   │   │   ├── StaticAnalyzerClient.java    (HTTP client to Python service)
│   │   │   ├── SemanticAnalyzer.java        (interface)
│   │   │   ├── JavaSemanticAnalyzer.java
│   │   │   └── LLMJudgeService.java
│   │   ├── llm/
│   │   │   ├── ClaudeAPIClient.java
│   │   │   ├── PromptBuilder.java
│   │   │   └── LLMResponseParser.java
│   │   ├── model/
│   │   │   ├── ReviewRequest.java
│   │   │   ├── ReviewReport.java
│   │   │   ├── Finding.java
│   │   │   ├── FindingCategory.java    (enum)
│   │   │   ├── Severity.java           (enum)
│   │   │   └── Confidence.java         (enum)
│   │   ├── repository/
│   │   │   ├── ReviewRepository.java
│   │   │   ├── FindingRepository.java
│   │   │   └── RuleRepository.java
│   │   └── config/
│   │       ├── SecurityConfig.java
│   │       └── WebConfig.java
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/              (Flyway)
│           ├── V1__create_reviews.sql
│           ├── V2__create_findings.sql
│           └── V3__create_rules.sql
├── analyzer/                          # Python static analysis service
│   ├── main.py                        (FastAPI app)
│   ├── parser/
│   │   └── tree_sitter_parser.py
│   ├── rules/
│   │   ├── base.py
│   │   ├── hallucination.py
│   │   ├── mirror_test.py
│   │   ├── ghost_handling.py
│   │   └── dead_replica.py
│   ├── resolver/
│   │   └── import_resolver.py
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml
└── pom.xml (parent)
```

### 1.2 — pom.xml (parent)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project>
    <groupId>eu.nexuslayer</groupId>
    <artifactId>agentreview-parent</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    
    <modules>
        <module>api</module>
    </modules>
    
    <properties>
        <java.version>21</java.version>
        <spring.boot.version>3.3.0</spring.boot.version>
    </properties>
</project>
```

### 1.3 — api/pom.xml key dependencies

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.mariadb.jdbc</groupId>
        <artifactId>mariadb-java-client</artifactId>
    </dependency>
    <dependency>
        <groupId>org.flywaydb</groupId>
        <artifactId>flyway-core</artifactId>
    </dependency>
    <dependency>
        <groupId>com.github.javaparser</groupId>
        <artifactId>javaparser-symbol-solver-core</artifactId>
        <version>3.25.9</version>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>
```

---

## Phase 2 — Database Schema

Create Flyway migrations in this order:

### V1__create_reviews.sql
```sql
CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    agent_id VARCHAR(255),
    language VARCHAR(50) NOT NULL,
    review_mode VARCHAR(20) NOT NULL DEFAULT 'full',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    task_description TEXT,
    risk_score INT,
    risk_label VARCHAR(20),
    recommendation VARCHAR(10),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms BIGINT,
    INDEX idx_agent_id (agent_id),
    INDEX idx_created_at (created_at),
    INDEX idx_recommendation (recommendation)
);
```

### V2__create_findings.sql
```sql
CREATE TABLE findings (
    id VARCHAR(36) PRIMARY KEY,
    review_id VARCHAR(36) NOT NULL,
    rule_id VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    confidence VARCHAR(20) NOT NULL,
    analysis_layer INT NOT NULL,
    file_path VARCHAR(500),
    line_start INT,
    line_end INT,
    description TEXT NOT NULL,
    suggestion TEXT,
    evidence TEXT,
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    INDEX idx_review_id (review_id),
    INDEX idx_rule_id (rule_id),
    INDEX idx_severity (severity)
);
```

### V3__create_rules.sql
```sql
CREATE TABLE custom_rule_sets (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_key VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE custom_rules (
    id VARCHAR(36) PRIMARY KEY,
    rule_set_id VARCHAR(36) NOT NULL,
    rule_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    languages JSON NOT NULL,
    pattern_type VARCHAR(50) NOT NULL,
    pattern JSON NOT NULL,
    message TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (rule_set_id) REFERENCES custom_rule_sets(id) ON DELETE CASCADE
);

CREATE TABLE built_in_rule_overrides (
    rule_id VARCHAR(100) PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    severity_override VARCHAR(20),
    config JSON
);
```

### V4__create_api_symbols.sql
```sql
CREATE TABLE api_symbols (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    package_name VARCHAR(255) NOT NULL,
    package_version VARCHAR(50) NOT NULL,
    language VARCHAR(20) NOT NULL,
    symbol_path VARCHAR(500) NOT NULL,
    symbol_type VARCHAR(50),
    introduced_in VARCHAR(50),
    deprecated_in VARCHAR(50),
    removed_in VARCHAR(50),
    replacement VARCHAR(500),
    INDEX idx_pkg_version (package_name, package_version),
    INDEX idx_symbol (symbol_path(191))
);
```

---

## Phase 3 — Core Domain Models

Build these in order. Use Lombok `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`.

### 3.1 — Enums first
```java
// FindingCategory.java — values: HALLUCINATION, INTENT_DRIFT, MIRROR_TEST, 
//   ABSTRACTION_SMELL, CONFIDENCE_BUG, DEAD_REPLICA, VERSION_BLIND, GHOST_HANDLING

// Severity.java — values: CRITICAL, HIGH, MEDIUM, LOW, INFO
//   Add: int getWeight() → CRITICAL=25, HIGH=15, MEDIUM=8, LOW=3, INFO=1

// Confidence.java — values: HIGH, MEDIUM, LOW
//   Add: double getMultiplier() → HIGH=1.0, MEDIUM=0.7, LOW=0.4

// ReviewMode.java — values: STATIC, FULL, LLM_ONLY

// ReviewStatus.java — values: PENDING, PROCESSING, COMPLETE, FAILED
```

### 3.2 — Finding.java
Fields: id, ruleId, category, severity, confidence, layer, filePath, lineStart, lineEnd, description, suggestion, evidence, reviewId

### 3.3 — ReviewRequest.java (input DTO)
Fields: taskDescription, language, reviewMode, agentId, files (List<ReviewFile>), context (ReviewContext), customRuleSets (List<String>)

Inner classes: ReviewFile (path, content, isDiff), ReviewContext (dependencies Map, existingCodeSnippets List)

### 3.4 — ReviewReport.java (output DTO)
Fields: reviewId, requestId, createdAt, durationMs, summary (ReviewSummary), findings, agentActionItems

### 3.5 — ReviewSummary.java
Fields: totalFindings, bySeverity (Map<Severity,Integer>), byCategory (Map<FindingCategory,Integer>), riskScore, riskLabel, recommendation

---

## Phase 4 — Rule Engine

### 4.1 — ReviewRule interface
See `04-rule-engine-spec.md` for the full interface definition.

### 4.2 — RuleContext record
```java
public record RuleContext(
    String code,
    String language,
    String taskDescription,
    Map<String, String> dependencies,
    List<Finding> priorFindings
    // AST parsing is done in Python; Java rules work on String patterns
    // unless JavaParser is used for Java-specific rules
) {}
```

### 4.3 — Built-in rules to implement

Implement each rule as a separate class in `rule/builtin/`. Each class implements `ReviewRule`. Start with these (highest value first):

**Priority 1 (implement first):**
1. `G1SwallowedExceptionRule` — regex/AST: catch blocks with only log statements
2. `M2SpecFreeTestRule` — count literal values in assertion positions  
3. `D3DeadImportRule` — imports not referenced in code body
4. `M3HappyPathOnlyRule` — test files with no error/edge case tests
5. `G4OptimisticAsyncRule` — async calls without error handlers

**Priority 2:**
6. `D1DuplicationRule` — normalized token similarity between functions
7. `M4MockOveruseRule` — mock count vs assertion count ratio
8. `A1SingleUseAbstractionRule` — interfaces with one implementation
9. `A4IndirectionRule` — methods that only delegate

**Priority 3 (require version DB):**
10. `H1HallucinatedImportRule` — cross-ref imports against declared deps
11. `V1FutureApiRule` — API used before it was introduced
12. `V2DeprecatedApiRule` — known deprecated/removed APIs

### 4.4 — RuleRegistry.java
```java
@Component
public class RuleRegistry {
    private final List<ReviewRule> builtInRules;
    private final CustomRuleRepository customRuleRepository;
    
    // On startup: scan for all @Component ReviewRule beans
    // Load custom rules from DB
    // Apply overrides from built_in_rule_overrides table
    
    public List<ReviewRule> getRulesFor(String language, List<String> customRuleSetIds) {
        // Return all enabled rules matching the language + requested custom sets
    }
}
```

---

## Phase 5 — Python Static Analyzer Service

### 5.1 — requirements.txt
```
fastapi==0.111.0
uvicorn==0.29.0
tree-sitter==0.22.3
tree-sitter-languages==1.10.2
pydantic==2.7.0
```

### 5.2 — main.py (FastAPI app)
```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="AgentReview Static Analyzer")

class AnalyzeRequest(BaseModel):
    code: str
    language: str
    task_description: str | None = None
    dependencies: dict[str, str] = {}

class FindingOut(BaseModel):
    rule_id: str
    category: str
    severity: str
    confidence: str
    file_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    description: str
    suggestion: str | None = None
    evidence: str | None = None

@app.post("/analyze", response_model=list[FindingOut])
async def analyze(request: AnalyzeRequest) -> list[FindingOut]:
    # 1. Parse AST with tree-sitter
    # 2. Run all static rules
    # 3. Return findings
```

### 5.3 — tree_sitter_parser.py
Use `tree_sitter_languages.get_language(lang)` and `tree_sitter_languages.get_parser(lang)`.
Implement: `parse()`, `extract_imports()`, `extract_functions()`, `extract_tests()`, `extract_try_catch()`.

### 5.4 — Static rule implementations
See `04-rule-engine-spec.md` for the algorithm for each rule.
Implement as Python classes in `rules/` directory.

---

## Phase 6 — LLM Judge Service

Reference `06-llm-judge-spec.md` for all prompt text and calling conventions.

### 6.1 — ClaudeAPIClient.java
```java
@Service
public class ClaudeAPIClient {
    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-sonnet-4-6";
    
    @Value("${anthropic.api.key}")
    private String apiKey;
    
    private final RestClient restClient;
    
    public String complete(String systemPrompt, String userPrompt) {
        // POST to API_URL
        // Headers: x-api-key: {apiKey}, anthropic-version: 2023-06-01
        // Body: { model, max_tokens: 4096, system, messages: [{role: user, content: userPrompt}] }
        // Return: response.content[0].text
    }
}
```

### 6.2 — PromptBuilder.java
Build each of the 5 sub-task prompts from doc 06.
Inject: task description, code, prior findings summary, language.
Truncate code at 4000 tokens (approximate: 16000 chars).

### 6.3 — LLMJudgeService.java
```java
@Service
public class LLMJudgeService {
    
    public List<Finding> judge(ReviewRequest request, List<Finding> priorFindings) {
        List<Finding> llmFindings = new ArrayList<>();
        
        // Always run: intent alignment
        llmFindings.addAll(runIntentCheck(request, priorFindings));
        
        // Always run: confidence bugs
        llmFindings.addAll(runConfidenceBugCheck(request, priorFindings));
        
        // If test files present: test quality
        if (hasTestFiles(request)) {
            llmFindings.addAll(runTestQualityCheck(request, priorFindings));
        }
        
        // If many classes: abstraction check
        if (classCount(request) >= 3) {
            llmFindings.addAll(runAbstractionCheck(request, priorFindings));
        }
        
        // Validate low-confidence prior findings
        List<Finding> lowConf = priorFindings.stream()
            .filter(f -> f.getConfidence() == Confidence.LOW)
            .toList();
        if (!lowConf.isEmpty()) {
            llmFindings.addAll(validateFindings(request, lowConf));
        }
        
        // Downgrade LLM finding confidence one level (HIGH→MEDIUM, MEDIUM→LOW, discard LOW)
        return llmFindings.stream()
            .map(this::downgradeConfidence)
            .filter(Objects::nonNull)
            .toList();
    }
}
```

### 6.4 — LLMResponseParser.java
Parse JSON from each sub-task response.
Defensive: strip markdown fences, handle missing fields gracefully.
Return empty list (not exception) if JSON is malformed.

---

## Phase 7 — Review Orchestrator

```java
@Service
public class ReviewOrchestrator {
    
    @Transactional
    public ReviewReport review(ReviewRequest request) {
        // 1. Create review record in DB with status=PROCESSING
        // 2. Call static analyzer (Python service via HTTP)
        // 3. Call semantic analyzer if language supported
        // 4. Call LLM judge if mode=full or has low-confidence findings
        // 5. Merge and deduplicate findings
        // 6. Calculate risk score
        // 7. Generate agent action items (sorted by priority)
        // 8. Build and save report
        // 9. Update review record with status=COMPLETE
        // 10. Return report
    }
    
    private List<Finding> deduplicate(List<Finding> findings) {
        // Group by (file, lineStart, category)
        // Within each group: keep highest severity, merge descriptions
    }
    
    private int calculateRiskScore(List<Finding> findings) {
        return findings.stream()
            .mapToInt(f -> (int)(f.getSeverity().getWeight() 
                                * f.getConfidence().getMultiplier()))
            .sum();
    }
    
    private String calculateRecommendation(int riskScore) {
        if (riskScore >= 76) return "BLOCK";
        if (riskScore >= 26) return "WARN";
        return "PASS";
    }
}
```

---

## Phase 8 — REST API Controller

Reference `07-api-spec.md` for all endpoint contracts.

```java
@RestController
@RequestMapping("/api/v1")
public class ReviewController {
    
    @PostMapping("/reviews")
    public ResponseEntity<?> submitReview(@RequestBody ReviewRequest request) {
        // For requests with total code < 200 lines: process synchronously
        // For larger requests: create review record, return 202 with polling URL
    }
    
    @GetMapping("/reviews/{reviewId}")
    public ReviewReport getReview(@PathVariable String reviewId) { ... }
    
    @GetMapping("/reviews/{reviewId}/status")
    public ReviewStatus getStatus(@PathVariable String reviewId) { ... }
    
    @GetMapping(value = "/reviews/{reviewId}/stream", 
                produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamReview(@PathVariable String reviewId) { ... }
    
    @GetMapping("/reviews")
    public Page<ReviewSummaryDto> listReviews(
        @RequestParam(required=false) String agentId,
        @RequestParam(required=false) String recommendation,
        Pageable pageable
    ) { ... }
    
    @PostMapping("/rule-sets")
    public RuleSetDto createRuleSet(@RequestBody CreateRuleSetRequest request) { ... }
    
    @GetMapping("/rules")
    public RulesDto listRules() { ... }
    
    @GetMapping("/analytics/agents/{agentId}")
    public AgentAnalyticsDto getAgentAnalytics(@PathVariable String agentId) { ... }
}
```

---

## Phase 9 — Docker Compose

```yaml
version: '3.9'

services:
  api:
    build: ./api
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mariadb://db:3306/agentreview
      SPRING_DATASOURCE_USERNAME: agentreview
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      ANALYZER_URL: http://analyzer:8081
    depends_on:
      db:
        condition: service_healthy
      analyzer:
        condition: service_started

  analyzer:
    build: ./analyzer
    ports:
      - "8081:8081"
    command: uvicorn main:app --host 0.0.0.0 --port 8081

  db:
    image: mariadb:11.4
    environment:
      MARIADB_DATABASE: agentreview
      MARIADB_USER: agentreview
      MARIADB_PASSWORD: ${DB_PASSWORD}
      MARIADB_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  db_data:
```

---

## Phase 10 — application.yml

```yaml
spring:
  application:
    name: agentreview
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:mariadb://localhost:3306/agentreview}
    username: ${SPRING_DATASOURCE_USERNAME:agentreview}
    password: ${SPRING_DATASOURCE_PASSWORD:password}
  jpa:
    hibernate:
      ddl-auto: validate
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration

anthropic:
  api:
    key: ${ANTHROPIC_API_KEY}

analyzer:
  url: ${ANALYZER_URL:http://localhost:8081}

agentreview:
  review:
    sync_max_lines: 200       # requests below this are processed synchronously
    llm_max_code_chars: 16000 # truncate code at this length before LLM call
  rules:
    cache_ttl_minutes: 60
  reports:
    ttl_days: 30              # delete old reports after N days
```

---

## Build Order Summary

1. ✅ Scaffold Maven + Python projects
2. ✅ Database schema (Flyway migrations)
3. ✅ Domain enums and models
4. ✅ Rule engine (interface + registry)
5. ✅ Priority 1 built-in rules (5 rules)
6. ✅ Python static analyzer service (FastAPI + tree-sitter)
7. ✅ Claude API client + LLM judge
8. ✅ Review Orchestrator
9. ✅ REST controller
10. ✅ Docker Compose
11. ✅ Priority 2 built-in rules (4 more rules)
12. ✅ Version database seed data + Priority 3 rules
13. ✅ Analytics endpoint
14. ✅ SSE streaming endpoint
15. ✅ Custom rule set API

---

## Definition of Done

- [ ] `docker compose up` starts all services with no errors
- [ ] `POST /api/v1/reviews` with a Java code sample returns a valid report
- [ ] Report contains at least one finding from each active layer
- [ ] All 9 Priority 1+2 rules fire correctly on test inputs (see below)
- [ ] LLM judge calls Claude API and returns structured findings
- [ ] `GET /analytics/agents/{id}` returns aggregate data

## Test Code Samples for Verification

Feed this to your review endpoint after building to verify rules fire:

```java
// This sample should trigger: G1 (swallowed exception), M2 (spec-free test implied),
// H2 (getFullName doesn't exist), D3 (unused import)

import com.example.NonExistentUtil;  // H1: this package doesn't exist
import java.util.List;               // D3: unused

public class UserService {
    public String getUserDisplay(User user) {
        return user.getFullName();   // H2: method doesn't exist on User
    }
    
    public User findByEmail(String email) {
        try {
            return userRepo.findByEmail(email);
        } catch (Exception e) {
            log.error("Failed", e);  // G1: swallowed exception, returns null implicitly
        }
        return null;
    }
    
    public void notifyAsync(String userId) {
        CompletableFuture.runAsync(() -> sendEmail(userId)); // G4: no error handler
    }
}
```
