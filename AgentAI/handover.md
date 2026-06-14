# Agent Handover

> You are an AI agent starting a new session. Read this file first, then `memory.md` and `state.md`.

---

## Project Overview

**AgentReview** — AI code review tool that detects AI-specific failure modes in generated code.

Stack:
- **Backend**: Java 21 + Spring Boot 3.3.4 + MariaDB 11.4 + Flyway (port 8080)
- **Analyzer**: Python 3.12 + FastAPI + tree-sitter (port 8081)
- **Frontend**: React 18 + TypeScript + Vite 5 + TailwindCSS 3 (port 3000)
- **Package**: `eu.nexuslayer.agentreview`
- **Root**: `/Users/admin/Documents/Thomas-SRC/CodeReviewAI/`

Three review entry points:
1. `POST /api/v1/reviews` — paste code
2. `POST /api/v1/reviews/directory` — local directory path
3. `POST /api/v1/reviews/git-diff` — repo URL or local path + branch/PR

---

## Current State

See `state.md`.

---

## What To Do Next

1. Run the full stack with `docker-compose up --build`
2. Verify backend starts cleanly (Flyway migrations, Spring context)
3. Register a user and run a test review
4. Fix any runtime issues (missing beans, classpath issues)

---

## Key Files & Directories

```
CodeReviewAI/
├── docker-compose.yml          — 4 services: api, analyzer, db, frontend
├── .env.example                — env vars template
├── pom.xml                     — parent POM (groupId eu.nexuslayer)
├── backend/
│   ├── pom.xml                 — Spring Boot 3.3.4, Java 21, all deps
│   ├── src/main/java/eu/nexuslayer/agentreview/
│   │   ├── AgentReviewApplication.java  — @SpringBootApplication @EnableAsync
│   │   ├── config/             — SecurityConfig, JacksonConfig
│   │   ├── controller/         — AuthController, ReviewController, RuleController, AnalyticsController
│   │   ├── dto/                — all request/response DTOs
│   │   ├── entity/             — User, Review, Finding (JPA)
│   │   ├── llm/                — LLMExecutor interface + 3 impls + factory + judge
│   │   ├── model/              — enums (ReviewStatus, ExecutorType, etc.)
│   │   ├── repository/         — UserRepository, ReviewRepository, FindingRepository
│   │   ├── rule/               — RuleEngine, RuleRegistry, ReviewRule interface, 5 built-in rules
│   │   ├── security/           — JwtService, JwtAuthFilter
│   │   └── service/            — ReviewOrchestrator, ReportBuilder, DirectoryReviewService, GitDiffService, StaticAnalyzerClient, AnalyticsService, UserService
│   └── src/main/resources/
│       ├── application.yml     — full Spring config with env-var overrides
│       └── db/migration/       — V1-V5 Flyway SQL migrations
├── analyzer/
│   ├── main.py                 — FastAPI app, /analyze and /health
│   ├── parser/tree_sitter_parser.py
│   └── rules/                  — ghost_handling, mirror_test, dead_replica
└── frontend/
    ├── src/
    │   ├── pages/              — LoginPage, RegisterPage, DashboardPage, NewReviewPage, ReviewDetailPage
    │   ├── components/layout/AppLayout.tsx
    │   ├── lib/                — api.ts, auth.ts, utils.ts
    │   └── types/index.ts
    └── nginx.conf
```
