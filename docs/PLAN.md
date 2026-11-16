# Development Roadmap & Implementation Plan — AI Mystery Room

**Document Version:** 2.1  
**Project:** AI Mystery Room  
**Status:** MVP Implemented Baseline / In Production Readiness  

---

## 1. Project Phase Overview

```mermaid
gantt
    title AI Mystery Room Development Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 (MVP Complete)
    Architecture & Spec Baseline       :done, p1_1, 2026-08-01, 2026-08-15
    Server & Gemini Generator Engine   :done, p1_2, 2026-08-16, 2026-09-01
    MongoDB Schemas & 30-Day TTL       :done, p1_3, 2026-09-02, 2026-09-10
    React SPA & Noir Design System     :done, p1_4, 2026-09-11, 2026-09-25
    Trilingual Localization (EN/HI/Hing) :done, p1_5, 2026-09-26, 2026-10-05
    Accusation & Truth Reveal Pipeline :done, p1_6, 2026-10-06, 2026-10-15
    Security, Proxy & Regression Tests :done, p1_7, 2026-10-16, 2026-10-30
    section Phase 2 (Future)
    User Accounts & Cross-Device Sync  :active, p2_1, 2027-01-01, 2027-02-15
    Cosmetic Achievements & Ranks      :p2_2, 2027-02-16, 2027-03-15
    section Phase 3 (Future)
    Interactive Drag-and-Drop Board    :p3_1, 2027-03-16, 2027-04-30
    Community Mysteries & Sharing      :p3_2, 2027-05-01, 2027-06-15
```

---

## 2. Implemented Milestones Audit (Phase 1 — MVP)

| Module | Features Completed | Implementation Files | Status |
|---|---|---|---|
| **Mystery Synthesis** | Structured case generation, difficulty scaling (Easy/Med/Hard), length tuning, random premise seeds across 6 categories. | `server/src/services/geminiService.js`, `randomPremises.js` | **Completed & Verified** |
| **Logic & Safety Engine** | Cross-reference integrity, clue deduction invariants (min 2 culprit clues, 1 weakening clue, difficulty-bound red herrings), real-person accusation screening, ISO timestamps, chronological timeline. | `server/src/services/geminiService.js`, `caseSchemas.js` | **Completed & Verified** |
| **Self-Repair Loop** | Up to 3 bounded Gemini retries with automated error feedback on invalid JSON or logical inconsistencies. | `server/src/services/geminiService.js` | **Completed & Verified** |
| **Data Persistence** | Dual-model architecture (`MysteryCase` vs `CaseSolution`), 30-day MongoDB TTL indexes, atomic accusation updates. | `server/src/models/MysteryCase.js`, `CaseSolution.js` | **Completed & Verified** |
| **Session System** | HMAC-SHA256 signed anonymous sessions (`mystery_session`), Lax, HttpOnly, Secure, backwards-compatible legacy token support. | `server/src/middleware/session.js`, `models/LegacySessionLease.js` | **Completed & Verified** |
| **Rate Limiting & Security** | In-flight concurrency gate (`MAX_CONCURRENT_GENERATIONS`), route rate limiters, strict CORS, CSP, no-store headers, request UUIDs. | `server/src/app.js`, `routes/caseRoutes.js` | **Completed & Verified** |
| **User Interface (SPA)** | Noir aesthetic, responsive typography (`DM Sans`, `Playfair Display`, `DM Mono`), landing hero, mystery intake form, category badges in library, preferences, WCAG 2.2 AA accessibility (dynamic `<title>` management across all SPA routes, `.sr-only` utility text, progressbar ARIA semantics). | `client/src/pages/`, `styles.css` | **Completed & Verified** |
| **Investigation Room** | Tabbed dossier (Case, Suspects, Evidence, Notes, Hints) with live review & hint counters, suspect profile dossiers, sticky accusation dock, evidence inspection modal with review tracking, debounced auto-saving notes. | `client/src/pages/CaseRoom.jsx`, `styles.css` | **Completed & Verified** |
| **Hints System** | 3-tier ordered hints (Nudge, Connection, Strong Hint) derived from verified solution reasoning, with tab counter (`Hints x/3`). | `server/src/routes/caseRoutes.js`, `client/src/pages/CaseRoom.jsx` | **Completed & Verified** |
| **Accusation & Reveal** | Persistent sticky viewport dock, irreversible confirmation modal, atomic evaluation, correct/incorrect reveal banner, clue reasoning deconstruction, dynamic translation. | `server/src/routes/caseRoutes.js`, `client/src/pages/CaseRoom.jsx`, `styles.css` | **Completed & Verified** |
| **Localization** | Trilingual i18n support (English, Hindi Devanagari, Hinglish Romanized Hindi) with script integrity checks. | `client/src/i18n.jsx`, `server/src/services/geminiService.js` | **Completed & Verified** |
| **Deployment Assets** | Vercel serverless API proxy (`client/api/[...path].js` with `maxDuration: 60`), Vercel rewrites and CSP (`vercel.json`), Render web service config, zero-secret environment parity. | `client/api/`, `client/vercel.json`, `server/src/server.js` | **Completed & Verified** |

---

## 3. Verification & Test Readiness Matrix

| Test Suite | File Location | Purpose | Execution Status |
|---|---|---|---|
| **Server Security & Session** | `server/test/sessionSecurity.test.js` | Verifies cookie signing, HMAC integrity, HttpOnly, Secure, and tamper rejection. | **Passed** |
| **Scenario Input Validation** | `server/test/caseValidation.test.js` | Verifies prompt character limits, category options, and invalid input rejection. | **Passed** |
| **Reference Validation** | `server/test/caseValidation.test.js` | Tests culprit existence, duplicate ID prevention, red herring limits, and leak regexes. | **Passed** |
| **Gemini Self-Repair** | `server/test/caseValidation.test.js` | Validates bounded 3-attempt repair loop with mocked invalid JSON. | **Passed** |
| **Random Premises** | `server/test/randomPremises.test.js` | Confirms all 6 categories return valid fictional seed texts. | **Passed** |
| **Error Status Mapping** | `server/test/errorMapping.test.js` | Ensures provider quota exhaustion maps to distinguishable 429/503 errors. | **Passed** |
| **Client i18n & Quota** | `client/test/i18n.test.js` | Verifies localized error message translation and language picker state. | **Passed** |
| **Vercel Proxy Config** | `client/test/vercelConfig.test.js` | Tests API rewrites, security headers, and rejection of malformed `API_ORIGIN`. | **Passed** |
| **XSS Defense** | `client/test/xss.test.js` | Proves `PlainText` escapes script/image execution payloads. | **Passed** |
| **End-to-End Acceptance** | `client/e2e/case-acceptance.spec.js` | Complete Playwright workflow from creation to accusation and reveal. | **Configured & Validated** |
| **Backend Integration** | `server/test/caseFlow.test.js` | End-to-end API integration flow with graceful skip when host MongoDB is offline; automatically executes in CI/containerized environments. | **Passed (Clean Skip on Offline Host)** |

---

## 4. Known Technical Debt & Non-Blocking Observations

1. **Host MongoDB Integration Test Resilience:**
   - `server/test/caseFlow.test.js` connects to `mongodb://127.0.0.1:27017/ai_mystery_room_e2e`. The test suite features graceful connection fallback: when a local daemon is absent, the test marks itself as skipped and `npm test` finishes with a 100% green exit code `0`. In CI pipelines, configuring a `services: mongodb` container runs the test automatically.
2. **Dynamic Translation Fallback:**
   - When a user views a completed case in a different language, `translateReveal()` makes an on-the-fly Gemini call. If Gemini is rate-limited or fails, the interface falls back to the original case generation language. This is by design to ensure the user never loses access to their solved case.

---

## 5. Future Phases Backlog (Post-MVP)

### Phase 2: Optional User Identity & Cross-Device Persistence
- [ ] Add optional email/magic-link authentication.
- [ ] Implement session migration tool: import anonymous investigations into an authenticated user profile upon sign-in.
- [ ] Detective profiles: track cases solved, accuracy percentage, and favorite mystery categories.
- [ ] Cosmetic achievements (e.g., "Eagle Eye: Solved without hints", "Master of Locked Rooms").

### Phase 3: Enhanced Deductive Mechanics
- [ ] Interactive corkboard / mind-map evidence board: allow players to drag, drop, and link suspects to evidence pins with red virtual yarn.
- [ ] Audio soundscapes: subtle ambient rain, ticking clock, and vintage jazz noir background audio (with user mute toggle).
- [ ] Multiple accusation modes for Hard difficulty (e.g., must select both the culprit and the primary supporting clue).

### Phase 4: Community & UGC
- [ ] Case sharing via shortlinks (with solution locked behind player accusation).
- [ ] Community-rated mystery feed.

---

## 6. Definition of Done (DoD)

A feature or change is considered **Done** only when:
1. It adheres to all product requirements defined in `docs/PRD.md`.
2. It introduces zero client-side leaks of the canonical solution.
3. Untrusted strings are rendered exclusively via `PlainText` or safe text nodes.
4. Input fields are strictly validated via Zod schemas server-side.
5. All automated unit tests in `server/` and `client/` pass.
6. Documentation files in `docs/` are updated to match the code change.

