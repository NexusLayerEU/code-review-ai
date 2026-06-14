# AgentReview — REST API Specification
## Document 07

Base URL: `http://localhost:8080/api/v1`

---

## Authentication

All endpoints require a Bearer token:
```
Authorization: Bearer <api_key>
```

API keys are provisioned via `POST /api/v1/keys` (admin only).
Pass `X-Agent-ID: <agent_id>` header to associate requests with a specific agent.

---

## Endpoints

---

### POST /reviews
Submit code for review.

**Request Body:**
```json
{
  "task_description": "Add a method to UserService that looks up a user by email and returns null if not found.",
  "language": "java",
  "review_mode": "full",
  "agent_id": "claude-code-v1",
  "files": [
    {
      "path": "src/main/java/com/example/UserService.java",
      "content": "public class UserService {\n    ...\n}",
      "is_diff": false
    },
    {
      "path": "src/test/java/com/example/UserServiceTest.java",
      "content": "...",
      "is_diff": false
    }
  ],
  "context": {
    "dependencies": {
      "org.springframework.boot:spring-boot-starter-data-jpa": "3.2.0",
      "org.projectlombok:lombok": "1.18.30"
    },
    "existing_code_snippets": [
      {
        "description": "User entity class",
        "content": "@Entity\npublic class User {\n    private Long id;\n    private String email;\n    private String firstName;\n    private String lastName;\n}"
      }
    ]
  },
  "custom_rule_sets": []
}
```

**review_mode values:**
- `static` — Layer 1 only (fast, no LLM)
- `full` — All 3 layers (recommended)
- `llm_only` — Skip static/semantic, go straight to LLM

**Response (sync, for small requests < 50 lines):**
```json
{
  "review_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETE",
  "created_at": "2026-06-14T10:30:00Z",
  "duration_ms": 4250,
  "summary": {
    "total_findings": 5,
    "by_severity": {
      "CRITICAL": 0,
      "HIGH": 2,
      "MEDIUM": 2,
      "LOW": 1,
      "INFO": 0
    },
    "by_category": {
      "HALLUCINATION": 1,
      "MIRROR_TEST": 2,
      "GHOST_HANDLING": 1,
      "DEAD_REPLICA": 1
    },
    "risk_score": 58,
    "risk_label": "MEDIUM",
    "recommendation": "WARN"
  },
  "findings": [
    {
      "id": "f1a2b3c4-...",
      "rule_id": "AI_H2_HALLUCINATED_METHOD",
      "category": "HALLUCINATION",
      "severity": "HIGH",
      "confidence": "HIGH",
      "layer": 2,
      "file": "src/main/java/com/example/UserService.java",
      "line_start": 24,
      "line_end": 24,
      "description": "Method 'getFullName()' does not exist on User class. User has 'getFirstName()' and 'getLastName()'.",
      "suggestion": "Replace with user.getFirstName() + \" \" + user.getLastName()",
      "evidence": "String name = user.getFullName();"
    }
  ],
  "agent_action_items": [
    {
      "priority": 1,
      "action": "FIX",
      "finding_id": "f1a2b3c4-...",
      "instruction": "Line 24: user.getFullName() does not exist. Replace with user.getFirstName() + \" \" + user.getLastName()"
    },
    {
      "priority": 2,
      "action": "REWRITE",
      "finding_id": "...",
      "instruction": "UserServiceTest.testFindByEmail() is a tautological test. Rewrite to assert specific expected values, not to call the function again."
    }
  ]
}
```

**Response (async, for large requests):**
```json
{
  "review_id": "550e8400-...",
  "status": "PROCESSING",
  "polling_url": "/api/v1/reviews/550e8400-.../status",
  "stream_url": "/api/v1/reviews/550e8400-.../stream"
}
```

---

### GET /reviews/{review_id}
Get a completed review report.

**Response:** Same as POST /reviews sync response.

---

### GET /reviews/{review_id}/status
Poll for async review status.

**Response:**
```json
{
  "review_id": "...",
  "status": "PROCESSING | COMPLETE | FAILED",
  "progress": {
    "layer1_complete": true,
    "layer2_complete": true,
    "layer3_complete": false,
    "current_step": "Running LLM intent alignment check"
  }
}
```

---

### GET /reviews/{review_id}/stream
Server-Sent Events stream for real-time findings as they are discovered.

**Events:**
```
event: finding
data: {"finding": {...finding object...}, "layer": 1}

event: finding
data: {"finding": {...finding object...}, "layer": 2}

event: complete
data: {"review_id": "...", "summary": {...}}
```

---

### GET /reviews
List recent reviews.

**Query params:**
- `agent_id` — filter by agent
- `recommendation` — filter by BLOCK | WARN | PASS
- `from` — ISO8601 date
- `to` — ISO8601 date
- `page`, `size`

**Response:**
```json
{
  "reviews": [
    {
      "review_id": "...",
      "agent_id": "claude-code-v1",
      "created_at": "...",
      "language": "java",
      "recommendation": "WARN",
      "risk_score": 58,
      "finding_count": 5
    }
  ],
  "total": 142,
  "page": 0,
  "size": 20
}
```

---

### POST /rule-sets
Create a custom rule set.

**Request Body:**
```json
{
  "name": "My Company Rules",
  "description": "Rules specific to our codebase conventions",
  "rules": [
    {
      "id": "CUSTOM_NO_REPO_IN_CONTROLLER",
      "name": "No Repository in Controller",
      "category": "ABSTRACTION_SMELL",
      "severity": "HIGH",
      "languages": ["java"],
      "pattern_type": "AST_PATH",
      "pattern": {
        "node_type": "MethodCall",
        "in_class_annotation": "@RestController",
        "callee_type_matches": ".*Repository"
      },
      "message": "Controllers must not access repositories directly."
    }
  ]
}
```

**Response:**
```json
{
  "rule_set_id": "rs_abc123",
  "name": "My Company Rules",
  "rule_count": 1,
  "created_at": "..."
}
```

---

### GET /analytics/agents/{agent_id}
Get failure analytics for a specific agent.

**Response:**
```json
{
  "agent_id": "claude-code-v1",
  "period": "last_30_days",
  "review_count": 48,
  "top_failure_categories": [
    { "category": "MIRROR_TEST", "count": 23, "percentage": 48 },
    { "category": "GHOST_HANDLING", "count": 18, "percentage": 37 },
    { "category": "INTENT_DRIFT", "count": 12, "percentage": 25 }
  ],
  "trend": {
    "risk_score_avg": [
      { "date": "2026-05-14", "avg_score": 72 },
      { "date": "2026-05-21", "avg_score": 65 },
      { "date": "2026-05-28", "avg_score": 58 },
      { "date": "2026-06-07", "avg_score": 51 }
    ]
  },
  "most_common_rules": [
    { "rule_id": "AI_M2_SPEC_FREE", "count": 19 },
    { "rule_id": "AI_G1_SWALLOWED", "count": 15 }
  ]
}
```

---

### GET /rules
List all active rules.

**Response:**
```json
{
  "built_in_rules": [
    {
      "id": "AI_H1_HALLUCINATED_IMPORT",
      "name": "Hallucinated Import",
      "category": "HALLUCINATION",
      "severity": "CRITICAL",
      "languages": ["python", "typescript", "java"],
      "enabled": true
    }
  ],
  "custom_rule_sets": [
    {
      "rule_set_id": "rs_abc123",
      "name": "My Company Rules",
      "rules": [...]
    }
  ]
}
```

---

### POST /rules/{rule_id}/toggle
Enable or disable a built-in rule globally.

**Request Body:**
```json
{ "enabled": false }
```

---

## Error Responses

```json
{
  "error": "INVALID_REQUEST",
  "message": "task_description is required for review_mode=full",
  "detail": null
}
```

**Error codes:**
- `INVALID_REQUEST` — missing or malformed fields
- `LANGUAGE_NOT_SUPPORTED` — language has no analyzer
- `FILE_TOO_LARGE` — single file exceeds 500KB
- `RATE_LIMITED` — too many requests from this agent_id
- `LLM_UNAVAILABLE` — Anthropic API unreachable (review runs with static only)
- `REVIEW_NOT_FOUND` — unknown review_id

---

## Risk Score Calculation

```
risk_score = Σ(finding_severity_weight × finding_confidence_weight)

severity weights:  CRITICAL=25, HIGH=15, MEDIUM=8, LOW=3, INFO=1
confidence weights: HIGH=1.0, MEDIUM=0.7, LOW=0.4

risk_label:
  0–25   → LOW   → recommendation: PASS
  26–50  → MEDIUM → recommendation: WARN
  51–75  → HIGH  → recommendation: WARN (strong)
  76+    → CRITICAL → recommendation: BLOCK
```

---

## Webhook

Configure `AGENTREVIEW_WEBHOOK_URL` env var to receive POST on review completion:

```json
{
  "event": "review.complete",
  "review_id": "...",
  "agent_id": "...",
  "recommendation": "WARN",
  "risk_score": 58,
  "critical_count": 0,
  "high_count": 2,
  "report_url": "http://localhost:8080/api/v1/reviews/..."
}
```
