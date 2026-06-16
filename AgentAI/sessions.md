# Session Log

## Session 2026-06-16 (Launch Day)

- Did: Full pre-launch preparation and deployment
- Changed:
  - `frontend/src/pages/SettingsPage.tsx` — removed claude-cli + antigravity executor options, default changed to anthropic
  - `frontend/src/pages/NewReviewPage.tsx` — removed CLI executors, replaced directory tab with ZIP upload (JSZip)
  - `frontend/src/pages/LandingPage.tsx` — removed CLI executor cards + table rows, updated stats (executors 4→2, rules 12+→15+), added support section box
  - `frontend/src/pages/DashboardPage.tsx` — added Remote Skill promo banner
  - `frontend/src/pages/SupportPage.tsx` — new page (public + app route)
  - `frontend/src/pages/ClaudeSkillPage.tsx` — replaced 192.168.68.111:8200 with https://review.nexuslayer.eu
  - `frontend/src/pages/RulesPage.tsx` — updated QUA rules, added debug output + TODO/FIXME entries
  - `frontend/src/types/index.ts` — ExecutorType narrowed to CLAUDE_API | REMOTE_SKILL
  - `frontend/src/components/layout/AppLayout.tsx` — added Support nav item
  - `frontend/package.json` — added jszip ^3.10.1
  - `backend/.../rule/builtin/S1HardcodedSecretRule.java` — new CRITICAL rule
  - `backend/.../rule/builtin/D1ConsoleDebugRule.java` — new LOW rule
  - `backend/.../rule/builtin/G2BroadExceptionCatchRule.java` — new MEDIUM rule
  - `frontend/src/App.tsx` — added /support public route + /app/support private route
- Decided:
  - ZIP upload extracts client-side via JSZip and submits as files[] array — no backend changes needed
  - ExecutorType will only ever be CLAUDE_API or REMOTE_SKILL going forward
  - Support contacts: admin@nexuslayer.eu (general), sales@nexuslayer.eu (enterprise/deployment)
- Next: Monitor early access feedback, consider rate limiting per user, watch backend logs for errors

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
