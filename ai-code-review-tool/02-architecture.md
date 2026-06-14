# AgentReview — System Architecture
## Document 02

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│  CI Pipeline  │  Agent Orchestrator  │  Developer CLI / UI      │
└───────┬───────┴──────────┬───────────┴──────────────┬───────────┘
        │                  │                           │
        └──────────────────▼───────────────────────────┘
                           │  REST API
                  ┌────────▼────────┐
                  │   API Gateway   │  Spring Boot 3
                  │  (Rate Limit,   │
                  │   Auth, Route)  │
                  └────────┬────────┘
                           │
              ┌────────────▼─────────────┐
              │      Review Orchestrator  │
              │  (coordinates all layers) │
              └──┬─────────┬─────────┬───┘
                 │         │         │
        ┌────────▼──┐ ┌────▼─────┐ ┌▼────────────┐
        │  Static   │ │ Semantic │ │ LLM Judge   │
        │ Analyzer  │ │ Analyzer │ │  Layer      │
        │ (Layer 1) │ │ (Layer 2)│ │  (Layer 3)  │
        └────────┬──┘ └────┬─────┘ └┬────────────┘
                 │         │        │
        ┌────────▼─────────▼────────▼──┐
        │        Rule Engine           │
        │  (evaluates all findings)    │
        └────────────────┬─────────────┘
                         │
              ┌──────────▼──────────┐
              │   Report Builder    │
              │ (assembles output)  │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────┐
              │     MariaDB         │
              │  (rules, reports,   │
              │   history, metrics) │
              └─────────────────────┘
```

---

## Component Descriptions

### API Gateway
- Spring Boot 3 REST controller
- Accepts `POST /review` with `ReviewRequest` body
- Supports both sync (small diffs) and async (large files, SSE streaming)
- JWT auth for multi-tenant deployments
- Rate limiting per `agent_id`

### Review Orchestrator
- Coordinates the three analysis layers
- Runs Layer 1 always
- Runs Layer 2 if the language has a semantic analyzer available
- Runs Layer 3 (LLM) based on config or if Layer 1/2 findings are ambiguous
- Merges and deduplicates findings across layers
- Passes context between layers (Layer 2 can use Layer 1 findings)

### Static Analyzer — Layer 1
- Fast, deterministic, no LLM calls
- Uses AST parsing (tree-sitter for multi-language support)
- Runs the Rule Engine against structural patterns
- Detects: hallucinated imports, dead code, mirrored tests, fake abstraction markers
- Latency target: < 2 seconds

### Semantic Analyzer — Layer 2
- Deeper analysis using language-specific tools
- Python: AST + symbol resolution
- TypeScript: TypeScript compiler API
- Java: JavaParser
- Detects: wrong API versions, type-level hallucinations, unreachable logic
- Latency target: < 5 seconds

### LLM Judge Layer — Layer 3
- Calls Claude API with a structured prompt
- Receives: code + task description + Layer 1+2 findings
- Judges: intent alignment, semantic correctness, test validity
- Returns structured JSON findings
- Latency target: < 25 seconds
- See doc 06 for full spec

### Rule Engine
- Central registry of all rules
- Each rule: `id`, `name`, `category`, `severity`, `detector` function
- Detectors are pure functions: `(ASTNode | string) -> Finding | null`
- Rules loaded from DB + built-in rules at startup
- Custom rules can be added via API

### Report Builder
- Aggregates findings from all layers
- Deduplicates overlapping findings (same line, different detectors)
- Ranks findings by severity × confidence
- Generates human summary and machine-readable JSON
- Stores report in DB with TTL

---

## Data Models

### ReviewRequest
```json
{
  "id": "uuid",
  "agent_id": "string (optional)",
  "task_description": "string — the original prompt given to the agent",
  "language": "python | typescript | java | ...",
  "files": [
    {
      "path": "src/service/UserService.java",
      "content": "full file content or diff",
      "is_diff": false
    }
  ],
  "context": {
    "existing_code_snippets": [],
    "api_docs": "string (optional)",
    "dependencies": { "package": "version" }
  },
  "review_mode": "static | full | llm_only",
  "custom_rule_sets": ["rule_set_id"]
}
```

### Finding
```json
{
  "id": "uuid",
  "rule_id": "AI_HALLUCINATED_IMPORT",
  "category": "HALLUCINATION",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFO",
  "confidence": "HIGH | MEDIUM | LOW",
  "layer": 1,
  "file": "src/service/UserService.java",
  "line_start": 12,
  "line_end": 14,
  "description": "Import 'com.example.NonExistentUtil' does not exist in declared dependencies",
  "suggestion": "Remove import or add dependency. Did you mean 'com.example.StringUtil'?",
  "evidence": "import com.example.NonExistentUtil;"
}
```

### ReviewReport
```json
{
  "review_id": "uuid",
  "request_id": "uuid",
  "created_at": "ISO8601",
  "summary": {
    "total_findings": 12,
    "by_severity": { "CRITICAL": 1, "HIGH": 3, "MEDIUM": 5, "LOW": 3 },
    "by_category": { "HALLUCINATION": 2, "INTENT_DRIFT": 4, "TEST_MIRRORING": 3 },
    "risk_score": 72,
    "risk_label": "HIGH",
    "recommendation": "BLOCK | WARN | PASS"
  },
  "findings": [],
  "agent_action_items": [
    {
      "priority": 1,
      "action": "FIX",
      "finding_id": "uuid",
      "instruction": "The import on line 12 does not exist. Remove it."
    }
  ]
}
```

---

## Deployment

### Docker Compose (minimum viable)
```yaml
services:
  agentreview-api:
    build: .
    ports: ["8080:8080"]
    environment:
      - DB_URL=jdbc:mariadb://db:3306/agentreview
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on: [db, analyzer]

  analyzer:
    build: ./analyzer
    # Python service for AST analysis

  db:
    image: mariadb:11
    environment:
      MARIADB_DATABASE: agentreview
      MARIADB_ROOT_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
```

---

## Extension Points

| Extension Point | How |
|---|---|
| New language support | Add tree-sitter grammar + language-specific rules |
| Custom rule sets | POST to `/rule-sets` API |
| New LLM judge | Implement `LLMJudge` interface, swap via config |
| New output format | Implement `ReportFormatter` interface |
| Webhook notifications | Configure `POST_REVIEW_WEBHOOK` env var |
