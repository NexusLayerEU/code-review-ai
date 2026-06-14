# Session Log

## Session 2026-06-14

- Did:
  - Read and analyzed full spec (8 documents, ~80KB)
  - Built complete AgentReview full-stack application from scratch
  - Java 21 + Spring Boot 3.3.4 backend with JWT auth, 3-layer review pipeline
  - Python 3.12 FastAPI static analyzer with tree-sitter and 8 built-in rules
  - React 18 + TypeScript + Vite 5 + TailwindCSS 3 frontend with all 5 pages
  - User additions: directory review mode, git-diff/PR mode, per-job LLM executor choice (API/CLI/Antigravity)
- Changed: All files — initial build, nothing existed before
- Decided:
  - LLM confidence downgrade by one step to prevent false BLOCK recommendations
  - V5 Flyway migration creates users table last then adds FK via ALTER TABLE (avoids circular dep)
  - Python analyzer gracefully degrades to empty findings if unreachable
  - @Async reviews return 202 immediately with polling URL
- Next: Run `docker-compose up --build`, test registration, run first code review
