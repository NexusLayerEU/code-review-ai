# Project Memory

Captures architectural decisions, hard-won lessons, and constraints for AgentReview.

---

## Architectural Decisions

### 1. Three-Layer Review Pipeline
Layer 1 = Python FastAPI static analyzer (tree-sitter AST, port 8081) — fast, no LLM cost
Layer 2 = Java rule engine (built-in ReviewRule beans) — catches category-specific patterns
Layer 3 = LLM judge (async, via LLMExecutorFactory) — high-signal semantic findings

The Python service gracefully degrades: if unreachable, StaticAnalyzerClient returns [] and review proceeds with layers 2+3 only.

### 2. Per-Job LLM Executor
LLMExecutor interface with three implementations:
- AnthropicApiExecutor — direct HTTPS to api.anthropic.com/v1/messages
- ClaudeCodeCliExecutor — shells out to `claude --print -p "..."` (uses existing Claude Code subscription)
- AntGravityCliExecutor — shells out to `antigravity ask "..."`

ExecutorConfigDto carries the choice per ReviewRequest. LLMExecutorFactory creates the right one. Default: CLAUDE_API using ANTHROPIC_API_KEY env var.

### 3. LLM Confidence Downgrade
All LLM-generated findings have confidence downgraded one step (HIGH→MEDIUM, MEDIUM→LOW, LOW→dropped) in LLMJudgeService. This prevents overly confident LLM claims from triggering BLOCK when the static analysis is uncertain.

### 4. Risk Scoring
riskScore = sum of (severity.weight × confidence.multiplier) for all findings
0-25 → PASS, 26-75 → WARN, 76+ → BLOCK
Severity weights: CRITICAL=25, HIGH=15, MEDIUM=8, LOW=3, INFO=1
Confidence multipliers: HIGH=1.0, MEDIUM=0.7, LOW=0.4

### 5. Directory & Git Diff Modes
DirectoryReviewService walks local filesystem, collects ≤50 files ≤512KB, skips noise dirs.
GitDiffService supports: branch-to-branch, PR number (GitHub refs/pull/N/head), or HEAD~1..HEAD.
Both convert to standard ReviewRequest before passing to orchestrator.

### 6. JWT Auth
JJWT 0.12.3, stateless Spring Security sessions, BCrypt password encoding.
User entity implements UserDetails directly to keep Spring Security integration minimal.
Tokens expire in 24h (configurable via jwt.expiration-ms).

### 7. MariaDB + Flyway
5 migrations (V1-V5). V5 creates users table LAST then adds FK constraints back to reviews and custom_rule_sets via ALTER TABLE, avoiding circular dependency during Flyway migration order.
flyway-mysql artifact is required for MariaDB + Spring Boot 3/Flyway 10 compatibility.

### 8. Async Reviews
@EnableAsync on AgentReviewApplication. ReviewOrchestrator.runReview() is @Async.
Controller returns 202 Accepted with pollingUrl immediately.
Client polls GET /api/v1/reviews/{id}/status until status=COMPLETE or FAILED.

---

## Gotchas & Lessons

- **flyway-mysql required**: Without the `flyway-mysql` artifact, Flyway 10 with Spring Boot 3 fails to connect to MariaDB. Always include both `flyway-core` and `flyway-mysql`.
- **V5 FK ordering**: Users table must be created before adding FK constraints. Use ALTER TABLE in V5 instead of inline FOREIGN KEY in V1/V3 to avoid "table not found" during migration.
- **RestClient.Builder**: Spring Boot 3.2+ auto-configures RestClient.Builder as a prototype bean. Inject as-is; do not call .build() in the constructor — StaticAnalyzerClient calls .build() lazily to allow URL override from @Value.
- **LLM response stripping**: LLM responses often include markdown fences (```json ... ```). LLMResponseParser strips these before JSON.parse.
- **tree-sitter in Python**: tree-sitter 0.22.3 with tree-sitter-languages 1.10.2 is the stable combo. Newer tree-sitter versions have breaking parser API changes.
- **Frontend proxy**: Vite dev server proxies /api → localhost:8080. nginx.conf in frontend also proxies /api → api:8080 for Docker builds.
- **CORS**: SecurityConfig uses allowedOriginPatterns(["*"]) with allowCredentials(true). This is intentional for development; tighten for production.
