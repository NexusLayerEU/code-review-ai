# AgentReview — Product Specification
## Document 01

---

## Problem Statement

AI coding agents (Claude Code, Copilot, Cursor, custom agents) produce code that:

1. **Looks correct** — syntactically valid, well-formatted, consistent style
2. **Reads as confident** — no TODO comments, no hedging, no "I'm not sure about this"
3. **Fails silently** — wrong assumptions baked in as fact, hallucinated dependencies, tests that test the wrong thing

Existing review tools (ESLint, SonarQube, Semgrep, human PRs) were designed for human failure patterns. They check syntax, style, security patterns, and cyclomatic complexity. They do not check:

- Whether an API method the agent called actually exists in the version installed
- Whether the business logic matches the stated intent in the commit message / prompt
- Whether tests actually test the implementation or just mirror it
- Whether the agent introduced a plausible-but-wrong algorithm
- Whether abstractions created by the agent are semantically coherent

---

## Goals

### G1 — AI Failure Detection
Detect the specific failure modes of AI-generated code that traditional tools miss.

### G2 — Context-Aware Review
Accept the **original prompt / task description** alongside the code, and evaluate whether the code actually solves the stated problem.

### G3 — Confidence Calibration
Report not just issues, but **how confident the review is** about each finding. An uncertain finding is surfaced differently from a definite one.

### G4 — Agent-Friendly Output
Return structured, machine-readable output that a calling agent can act on — not just human-readable comments.

### G5 — Language Agnostic Core
Support multiple programming languages through a plugin architecture.

### G6 — Pluggable Rule Sets
Allow teams to define custom rules targeting their own AI agent's specific failure patterns.

---

## Non-Goals

- Not a replacement for human code review (it is a pre-review gate)
- Not a style linter (delegate to existing tools — ESLint, Prettier, Checkstyle)
- Not a security scanner (delegate to Semgrep, Snyk, etc.)
- Not an IDE plugin (though output format is compatible)

---

## User Personas

### Primary: The Agent Orchestrator
A developer or system that runs AI agents to generate code. They want an automated gate that catches AI-specific issues before the code reaches CI or human review.

**Job to be done:** "Before I merge this AI-generated PR, tell me what the agent got wrong that I won't see just by reading the diff."

### Secondary: The Platform Engineer
Building a platform that runs many AI agents. They need AgentReview integrated into their pipeline and want aggregate analytics on which failure types their agents make most.

### Tertiary: The AI Agent Itself
The coding agent that wrote the code is also a consumer of review output — so it can self-correct. Output must be structured for programmatic consumption.

---

## Core Concepts

### Review Request
A bundle submitted for review containing:
- `code` — the code to review (diff, file, or snippet)
- `language` — programming language
- `task_description` — the original prompt / task the agent was given
- `agent_id` — optional identifier for the agent that produced the code
- `context` — optional additional context (existing codebase snippets, API docs)

### Finding
A single identified issue with:
- `rule_id` — which rule triggered
- `severity` — CRITICAL / HIGH / MEDIUM / LOW / INFO
- `confidence` — HIGH / MEDIUM / LOW (how sure is the reviewer)
- `category` — from the AI failure taxonomy (see doc 03)
- `location` — file, line range
- `description` — what is wrong
- `suggestion` — how to fix it
- `evidence` — the specific code excerpt that triggered the rule

### Review Report
The full output for a Review Request containing:
- Summary scores per category
- All findings
- Overall risk assessment
- Agent-consumable action items

---

## Success Metrics

| Metric | Target |
|---|---|
| False positive rate | < 15% (findings that turn out to be fine) |
| False negative rate | < 20% (real bugs missed) |
| Review latency (static only) | < 5 seconds |
| Review latency (with LLM judge) | < 30 seconds |
| Languages supported at launch | Python, TypeScript/JavaScript, Java |
| Uptime | 99.5% |
