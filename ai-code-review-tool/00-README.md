# AgentReview — AI-Agent Code Review Tool
## Spec Package Overview

> **Purpose:** This package contains everything an autonomous coding agent needs to build `AgentReview`, a code review system purpose-built for code written by AI agents — not humans.

---

## Why AI-Generated Code Needs Different Review Rules

Human-written code has known failure modes: typos, off-by-one errors, copy-paste mistakes, poor naming. Traditional linters and code review tools catch those.

AI-generated code has a **different failure profile**:

| Human Code Failure | AI Code Failure |
|---|---|
| Forgetting edge cases | Confidently handling wrong edge cases |
| Inconsistent naming | Hyper-consistent but semantically wrong naming |
| Missing error handling | Plausible-looking but incorrect error handling |
| Copy-paste bugs | Hallucinated API signatures / non-existent methods |
| Unclear logic | Fluent logic with subtle wrong assumptions |
| Missing imports | Imports that exist but are wrong version / namespace |
| Dead code (obvious) | Dead code hidden in plausible-looking abstractions |
| Over-engineering | Over-abstraction that hides the real logic |
| Spaghetti | Fake modularity — well-structured but wrong decomposition |
| Bad tests | Tests that pass because they only test what the agent made up |

`AgentReview` targets these AI-specific failure modes as first-class concerns.

---

## Document Index

| # | File | Purpose |
|---|---|---|
| 00 | `00-README.md` | This file — overview and context |
| 01 | `01-product-spec.md` | Product definition, goals, non-goals |
| 02 | `02-architecture.md` | System architecture and component design |
| 03 | `03-ai-failure-taxonomy.md` | The full taxonomy of AI code failure modes |
| 04 | `04-rule-engine-spec.md` | Rule engine design and built-in rule definitions |
| 05 | `05-analyzer-modules.md` | Static + semantic analyzer module specs |
| 06 | `06-llm-judge-spec.md` | LLM-as-judge layer specification |
| 07 | `07-api-spec.md` | REST API contract (OpenAPI-style) |
| 08 | `08-agent-instructions.md` | Step-by-step build instructions for the coding agent |

---

## Stack Recommendation

| Layer | Technology |
|---|---|
| Backend | Java 21 + Spring Boot 3 |
| Analysis Engine | Python 3.12 subprocess (AST, tree-sitter) |
| LLM Judge | Anthropic Claude API (claude-sonnet-4-6) |
| Storage | MariaDB (rules, reports, history) |
| Queue | Spring Events or Redis Streams |
| API | REST + SSE for streaming results |
| Frontend (optional) | React 18 + TypeScript |
| Packaging | Docker Compose |

> Adjust to your preferred stack. The logic in this spec is language-agnostic.

---

## How to Use This Package

1. Feed `08-agent-instructions.md` to your coding agent as the primary entry point
2. The agent will reference other docs as it builds each component
3. Each doc is self-contained but cross-references others by document number
4. Start with the rule engine (`04`) — it is the core of the system
