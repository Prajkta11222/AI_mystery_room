# AI Mystery Room — Documentation Index & Knowledge Base

Welcome to the **Source-of-Truth Documentation Suite** for **AI Mystery Room**. This directory (`docs/`) serves as the definitive reference manual for product requirements, architecture, security, data models, APIs, and operations.

---

## 1. Documentation Map & File Index

The documentation suite is structured into 15 specialized files:

| # | File | Purpose & Contents |
|---|---|---|
| 01 | [PRD.md](file:///d:/Projects/AI%20Mystery%20Room/docs/PRD.md) | **Product Requirements Document:** Vision, personas, user journeys, MVP scope, core gameplay loop, and success metrics. |
| 02 | [DESIGN.md](file:///d:/Projects/AI%20Mystery%20Room/docs/DESIGN.md) | **Design System & UI/UX:** Noir aesthetic, design tokens, color palette, typography, responsive breakpoints, accessibility, and component specs. |
| 03 | [ARCHITECTURE.md](file:///d:/Projects/AI%20Mystery%20Room/docs/ARCHITECTURE.md) | **System Architecture:** End-to-end topology, SPA client, Vercel proxy, Express backend, MongoDB persistence, security boundaries, and concurrency gates. |
| 04 | [DATABASE.md](file:///d:/Projects/AI%20Mystery%20Room/docs/DATABASE.md) | **Database Schema & Data Models:** MongoDB schemas (`MysteryCase`, `CaseSolution`, `LegacySessionLease`), indexes, 30-day TTL lifecycle, and atomic update patterns. |
| 05 | [API.md](file:///d:/Projects/AI%20Mystery%20Room/docs/API.md) | **API Reference & Contracts:** Request/response schemas, error envelope, rate limits, headers, and full endpoint catalog (`/api/cases/*`, `/api/health`). |
| 06 | [AGENTS.md](file:///d:/Projects/AI%20Mystery%20Room/docs/AGENTS.md) | **AI Prompts & Agent Architecture:** Gemini prompt templates (`case-v2`), validation engine (`validateReferences`), self-repair loop, and reveal translation. |
| 07 | [README.md](file:///d:/Projects/AI%20Mystery%20Room/docs/README.md) | **Documentation Suite Hub:** This file. Overview, file index, navigation links, and documentation governance. |
| 08 | [PLAN.md](file:///d:/Projects/AI%20Mystery%20Room/docs/PLAN.md) | **Roadmap & Implementation Plan:** Completed MVP milestone audit, verification status, known technical debt, and future phase backlog. |
| 09 | [SETUP.md](file:///d:/Projects/AI%20Mystery%20Room/docs/SETUP.md) | **Developer & Environment Setup:** Prerequisites, local installation, environment variables matrix, dev server startup, and deployment guides. |
| 10 | [FEATURES.md](file:///d:/Projects/AI%20Mystery%20Room/docs/FEATURES.md) | **Feature Inventory & Status Matrix:** Comprehensive module-by-module feature registry marked with concrete implementation statuses. |
| 11 | [AUTH.md](file:///d:/Projects/AI%20Mystery%20Room/docs/AUTH.md) | **Authentication & Session Security:** Anonymous session mechanics (`mystery_session`), HMAC-SHA256 signature verification, cookie security flags, and future account specs. |
| 12 | [MCP.md](file:///d:/Projects/AI%20Mystery%20Room/docs/MCP.md) | **Model Context Protocol (MCP) Evaluation:** Current applicability assessment (Not Applicable), boundary analysis, and future agent extension guidelines. |
| 13 | [INTEGRATIONS.md](file:///d:/Projects/AI%20Mystery%20Room/docs/INTEGRATIONS.md) | **External Integrations:** Google Gemini API (AI Studio), MongoDB Atlas (SRV & DNS resolvers), Vercel Serverless Proxy, and Render Hosting. |
| 14 | [TESTING.md](file:///d:/Projects/AI%20Mystery%20Room/docs/TESTING.md) | **Testing Strategy & QA:** Unit test runner (`node:test`), backend integration test setup, frontend security tests, and Playwright E2E acceptance suites. |
| 15 | [DEBUGGING.md](file:///d:/Projects/AI%20Mystery%20Room/docs/DEBUGGING.md) | **Troubleshooting & Debugging:** Structured JSON log schemas, common error codes, diagnostic recipes, and recovery procedures. |

---

## 2. Documentation Governance & Principles

1. **Codebase Truth:** These documents describe the actual codebase in `server/` and `client/`. They must never document speculative features as implemented.
2. **Zero Secret Exposure:** Never commit live API keys, session secrets, database credentials, or real user identifiers into documentation.
3. **Consistency:** If changes are made to database models or API routes, the corresponding files (`DATABASE.md`, `API.md`, `ARCHITECTURE.md`) must be updated in lockstep.
4. **Preservation:** Root `README.md` and `spec.md` remain the overarching project roots; `docs/` expands these into a modular, deep reference architecture.

