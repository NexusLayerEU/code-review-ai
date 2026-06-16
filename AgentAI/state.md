# Project State

## Done

- [x] docker-compose.yml (4 services: api, analyzer, db, frontend)
- [x] .env.example
- [x] Parent pom.xml (eu.nexuslayer groupId)
- [x] backend/pom.xml (Spring Boot 3.3.4, Java 21, all dependencies)
- [x] AgentReviewApplication.java (@SpringBootApplication @EnableAsync)
- [x] application.yml (full config with env-var overrides)
- [x] backend/Dockerfile (multi-stage Maven build)
- [x] Flyway migrations V1-V5 (reviews, findings, rules, api_symbols, users)
- [x] Model enums (FindingCategory, Severity, Confidence, ReviewMode, ReviewStatus, ExecutorType, SourceType, UserRole)
- [x] JPA entities (User, Review, Finding)
- [x] DTOs (all request/response types including DirectoryReviewRequest, GitDiffReviewRequest, ExecutorConfigDto)
- [x] Repositories (UserRepository, ReviewRepository, FindingRepository)
- [x] Security (JwtService, JwtAuthFilter, SecurityConfig)
- [x] UserService (implements UserDetailsService, register + login)
- [x] AuthController (/api/v1/auth/register, /login, /me)
- [x] LLM executor layer (LLMExecutor, AnthropicApiExecutor, ClaudeCodeCliExecutor, AntGravityCliExecutor, LLMExecutorFactory)
- [x] PromptBuilder, LLMResponseParser, LLMJudgeService
- [x] Rule engine (ReviewRule, RuleContext, RuleEngine, RuleRegistry)
- [x] Built-in rules (G1SwallowedException, G4OptimisticAsync, D3DeadImport, M2SpecFree, M3HappyPathOnly)
- [x] JacksonConfig (ObjectMapper with JavaTimeModule)
- [x] StaticAnalyzerClient (HTTP client to Python service, graceful degradation)
- [x] DirectoryReviewService (filesystem walker → ReviewRequest)
- [x] GitDiffService (git diff → ReviewRequest, supports branch/PR/HEAD~1)
- [x] AnalyticsService (agent + user stats)
- [x] ReportBuilder (risk scoring, PASS/WARN/BLOCK recommendation)
- [x] ReviewOrchestrator (3-layer pipeline, @Async, saves findings)
- [x] ReviewController (/reviews, /reviews/directory, /reviews/git-diff, /{id}, /{id}/status)
- [x] RuleController (/rules)
- [x] AnalyticsController (/analytics/me, /analytics/agent/{id})
- [x] Python FastAPI analyzer (main.py, tree_sitter_parser, 8 rules)
- [x] analyzer/Dockerfile
- [x] Frontend scaffold (package.json, vite.config, tailwind, tsconfig)
- [x] Frontend types, api client, auth utils, App.tsx routing
- [x] AppLayout (sidebar nav)
- [x] LoginPage, RegisterPage
- [x] DashboardPage (stats + review list)
- [x] NewReviewPage (3 modes: code paste, directory, git diff; executor selector)
- [x] ReviewDetailPage (findings, risk gauge, action items, polling)
- [x] frontend/Dockerfile + nginx.conf

## In Progress

_Nothing — live in production._

## Blocked

_Nothing._

## Shipped (2026-06-16 launch day)

- [x] Removed Claude Code CLI + Antigravity CLI executors from all pages (Settings, NewReview, LandingPage, types)
- [x] Added Support page (/support public + /app/support private) — admin@nexuslayer.eu + sales@nexuslayer.eu
- [x] Support section box on LandingPage above footer
- [x] 3 new Java backend rules: AI_S1_HARDCODED_SECRET, AI_D1_CONSOLE_DEBUG, AI_G2_BROAD_CATCH
- [x] ZIP upload tab on NewReviewPage (JSZip client-side extraction, replaces directory scan)
- [x] Remote Skill promo banner on DashboardPage
- [x] Fixed ClaudeSkillPage URL → https://review.nexuslayer.eu
- [x] Fixed LandingPage stats: LLM executors 4→2, rules 12+→15+
- [x] Deployed to production: review.nexuslayer.eu
- [x] LinkedIn launch post published
