# Feature Inventory & Status Matrix — AI Mystery Room

**Document Version:** 2.1  
**Project:** AI Mystery Room  
**Status:** Implemented Baseline  

---

## 1. Feature Status Legend

- **`[Completed]`**: Implemented, fully integrated, and backed by codebase logic and automated tests.
- **`[Pending]`**: Architecture planned and specified in `spec.md`, but deferred to post-MVP roadmap.
- **`[Incomplete]`**: Partially implemented in the repository, pending full integration.
- **`[Unverified]`**: Implemented in code, but depends on live runtime infrastructure (e.g. active MongoDB or live Gemini API quota) for live verification.
- **`[Not Applicable]`**: Explicitly excluded from MVP scope to preserve focus on core deduction gameplay.

---

## 2. Module 1: Landing & Discovery (`/`)

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F1.1 | Noir Hero Presentation | Atmospheric landing page with hero illustration, title, and tagline. | `[Completed]` | `Landing.jsx`, `styles.css` |
| F1.2 | Three-Step Guide | "How it works" section (Set the scene, Follow the evidence, Name your suspect). | `[Completed]` | `Landing.jsx` |
| F1.3 | Trust & Fictional Badge | Explicit badge informing players that all scenarios and characters are fictional. | `[Completed]` | `Landing.jsx` |
| F1.4 | Language Picker | Header selector allowing immediate switching between English, Hindi, and Hinglish. | `[Completed]` | `i18n.jsx`, `Landing.jsx` |
| F1.5 | Direct CTA to Intake | "Start investigating" / "Create a mystery" buttons routing to `/create`. | `[Completed]` | `Landing.jsx` |
| F1.6 | Fast Resume Link | Header link directly routing to `/library` if user has active investigations. | `[Completed]` | `Landing.jsx` |

---

## 3. Module 2: Mystery Creation & Intake (`/create`)

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F2.1 | Custom Premise Input | Textarea accepting user scenarios between 30 and 1,000 characters. | `[Completed]` | `CreateCase.jsx`, `caseSchemas.js` |
| F2.2 | Character Counter & Warnings | Real-time counter warning when premise is below 30 or above 1,000 characters. | `[Completed]` | `CreateCase.jsx` |
| F2.3 | Real-Person Screen | Rejection of scenarios naming real individuals, employers, politicians, or celebrities. | `[Completed]` | `caseRoutes.js` (`realTarget`), `caseValidation.test.js` |
| F2.4 | Random Premise ("Surprise Me") | Toggle allowing one-click random premise generation across 6 mystery categories. | `[Completed]` | `randomPremises.js`, `CreateCase.jsx` |
| F2.5 | Category Selection | Choice of 6 categories: General, Locked Room, Art Theft, Disappearance, Historical, Espionage. | `[Completed]` | `caseSchemas.js`, `CreateCase.jsx` |
| F2.6 | Difficulty Selection | Easy (3 suspects, 4–5 clues), Medium (4 suspects, 6–7 clues), Hard (5 suspects, 8–10 clues). | `[Completed]` | `caseSchemas.js`, `geminiService.js` |
| F2.7 | Case Length Selection | Selection between Short, Medium, and Long case narratives. | `[Completed]` | `caseSchemas.js`, `CreateCase.jsx` |
| F2.8 | Language Selection | Creation-time case language selection (English, Hindi, Hinglish). | `[Completed]` | `CreateCase.jsx`, `caseRoutes.js` |
| F2.9 | Idempotency Key Injection | Frontend generates UUIDv4 `Idempotency-Key` header on creation submissions to prevent duplicate generation. | `[Completed]` | `CreateCase.jsx`, `caseRoutes.js` |

---

## 4. Module 3: Generative AI & Logic Synthesis

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F3.1 | Structured JSON Generation | Gemini API requested with `responseMimeType: 'application/json'` using `case-v2` prompt. | `[Completed]` | `geminiService.js` |
| F3.2 | Thinking Budget Support | Dynamic configuration of `thinkingConfig` for Gemini 3+ models (`low` level). | `[Completed]` | `geminiService.js`, `env.js` |
| F3.3 | Bounded Self-Repair Loop | Automatic re-prompting with syntax/schema errors for up to 3 total attempts. | `[Completed]` | `geminiService.js`, `caseValidation.test.js` |
| F3.4 | Deductive Clue Invariants | Enforces min 2 culprit clues, min 1 weakening clue, and difficulty-bounded red herrings. | `[Completed]` | `geminiService.js` (`validateReferences`) |
| F3.5 | Chronological Validation | Ensures incident time, timeline events, and evidence timestamps are ISO-8601 and ordered. | `[Completed]` | `geminiService.js` (`isIsoDateTime`) |
| F3.6 | Culprit Leak Prevention | Regex scan ensuring culprit name is never labeled as guilty in player-facing text. | `[Completed]` | `geminiService.js` (`validateReferences`) |
| F3.7 | Script Consistency Checks | Enforces Devanagari purity for Hindi and rejects mixed scripts in Latin cases. | `[Completed]` | `geminiService.js` (`validateReferences`) |
| F3.8 | Upstream Concurrency Limiter | Rejects requests with 429 when concurrent generations exceed `MAX_CONCURRENT_GENERATIONS`. | `[Completed]` | `caseRoutes.js` (`generationConcurrencyLimit`) |

---

## 5. Module 4: Investigation Room (`/case/:caseId`)

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F4.1 | Tabbed Navigation | Clean switching between Case, Suspects, Evidence, Notes, and Hints tabs with review and hint counter indicators. | `[Completed]` | `CaseRoom.jsx` |
| F4.2 | Case Dossier Overview | Displays incident synopsis, location, fictional date/time, and primary objective. | `[Completed]` | `CaseRoom.jsx` |
| F4.3 | Suspects Dossier | Cards detailing suspect names, roles, profiles (background dossier), relationships, and alibis. | `[Completed]` | `CaseRoom.jsx` |
| F4.4 | Suspect Selection | Ability to select a suspect for accusation with persistent indicator. | `[Completed]` | `CaseRoom.jsx` |
| F4.5 | Evidence Locker | List of evidence cards categorized by type (message, statement, document, image, CCTV). | `[Completed]` | `CaseRoom.jsx` |
| F4.6 | Evidence Detail Modal | Detailed clue inspection modal with trap focus, Escape dismiss, and metadata tags. | `[Completed]` | `CaseRoom.jsx` |
| F4.7 | Reviewed Status Tracking | Visual checkbox on evidence cards marking clues as inspected; updates progress bar. | `[Completed]` | `CaseRoom.jsx` |
| F4.8 | Timeline View | Chronological sequence of events displayed with visual milestone connector line. | `[Completed]` | `CaseRoom.jsx` |
| F4.9 | Onboarding Walkthrough Card | Floating tutorial card for first-time visitors; saved in `localStorage`. | `[Completed]` | `CaseRoom.jsx` |
| F4.10 | XSS Defense Rendering | Untrusted evidence and text rendered exclusively via `PlainText` text nodes. | `[Completed]` | `PlainText.js`, `xss.test.js` |

---

## 6. Module 5: Detective Notes & Hints

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F5.1 | Auto-Saving Notepad | Private free-text textarea with 500ms debounce auto-saving to server. | `[Completed]` | `CaseRoom.jsx`, `api.js` |
| F5.2 | Save State Indicator | UI indicator showing "Saving...", "Saved", or "Could not save" with retry button. | `[Completed]` | `CaseRoom.jsx` |
| F5.3 | 3-Tier Progressive Hints | Sequential hints: Level 1 (Nudge), Level 2 (Connection), Level 3 (Strong Hint). | `[Completed]` | `caseRoutes.js` (`makeHint`), `CaseRoom.jsx` |
| F5.4 | Grounded Hint Content | Hint text dynamically references validated clues from `CaseSolution.evidenceReasoning`. | `[Completed]` | `caseRoutes.js` (`makeHint`) |
| F5.5 | Sequential Order Enforcement | Server rejects requests for Hint 2 before Hint 1 with `409 HINT_OUT_OF_ORDER`. | `[Completed]` | `caseRoutes.js` |
| F5.6 | Hint Lockout Post-Submission | Rejects hint requests once the accusation has been made with `409 CASE_COMPLETED`. | `[Completed]` | `caseRoutes.js` |

---

## 7. Module 6: Accusation & Truth Reveal

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F6.1 | Persistent Accusation Bar | Viewport-sticky bottom bar (`position: sticky; bottom: 0`) displaying selected suspect and CTA button without scrolling. | `[Completed]` | `CaseRoom.jsx`, `styles.css` |
| F6.2 | Irreversible Confirmation Dialog | Modal requiring explicit confirmation before final accusation is processed. | `[Completed]` | `CaseRoom.jsx` |
| F6.3 | Atomic Evaluation | Atomic server evaluation matching accused ID with `CaseSolution.culpritId`. | `[Completed]` | `caseRoutes.js` |
| F6.4 | Correct / Incorrect Banners | Visual verdict banner styling: emerald green for correct, amber/rust for incorrect. | `[Completed]` | `CaseRoom.jsx`, `styles.css` |
| F6.5 | Truth Reveal Deconstruction | Displays culprit name, motive, method, full explanation narrative, and clue roles. | `[Completed]` | `CaseRoom.jsx`, `caseRoutes.js` |
| F6.6 | Idempotent Re-reveal | Subsequent visits or page refreshes return cached reveal payload immediately. | `[Completed]` | `caseRoutes.js` |
| F6.7 | Dynamic Reveal Translation | If user views reveal in another language, Gemini translates prose while keeping clue IDs intact. | `[Completed]` | `geminiService.js` (`translateReveal`) |
| F6.8 | Translation Fallback | If dynamic translation fails, falls back safely to original creation language. | `[Completed]` | `geminiService.js`, `caseRoutes.js` |

---

## 8. Module 7: Anonymous Persistence & Library

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F7.1 | Anonymous Signed Cookie | `mystery_session` cookie signed via HMAC-SHA256, HttpOnly, SameSite=Lax. | `[Completed]` | `session.js`, `sessionSecurity.test.js` |
| F7.2 | Legacy Session Migration | Resolves legacy unversioned tokens and automatically upgrades them to v2. | `[Completed]` | `session.js`, `LegacySessionLease.js` |
| F7.3 | 30-Day TTL Expiration | Automatic MongoDB purging of inactive cases and solutions after 30 days. | `[Completed]` | `MysteryCase.js`, `CaseSolution.js` |
| F7.4 | Investigation Library (`/library`) | Grid view of player investigations with category badges, status pills (In progress / Completed), difficulty, and language tags. | `[Completed]` | `Library.jsx` |
| F7.5 | Direct Case Deletion | Button allowing players to permanently delete a case and its solution record. | `[Completed]` | `Library.jsx`, `caseRoutes.js` |
| F7.6 | Preferences Page (`/preferences`) | Interface allowing language updates and resetting the onboarding walkthrough. | `[Completed]` | `Preferences.jsx` |

---

## 9. Module 8: Security & Edge Infrastructure

| Feature ID | Feature Name | Description | Status | Verification Reference |
|---|---|---|---|---|
| F8.1 | Route Rate Limiting | Specific rate limits on case creation, progress updates, hints, and accusations. | `[Completed]` | `caseRoutes.js` |
| F8.2 | Origin Mutation Enforcement | Rejects POST/PUT/PATCH/DELETE requests where `Origin` doesn't match `CLIENT_ORIGIN`. | `[Completed]` | `app.js` |
| F8.3 | Request Tracing | Unique UUIDv4 assigned to each request (`req.id` / `X-Request-Id`). | `[Completed]` | `app.js` |
| F8.4 | Defensive HTTP Headers | CSP, nosniff, frame-ancestors none, no-referrer, permissions-policy. | `[Completed]` | `app.js`, `vercel.json`, `vite.config.js` |
| F8.5 | Vercel Serverless API Proxy | Proxies `/api/*` requests through the frontend origin to preserve cookie access. | `[Completed]` | `client/api/[...path].js`, `vercelConfig.test.js` |
| F8.6 | Reverse Proxy Trust Control | Configurable `TRUST_PROXY_HOPS` for safe client IP resolution behind load balancers. | `[Completed]` | `env.js`, `app.js` |

---

## 10. Module 9: Non-MVP / Future Features

| Feature ID | Feature Name | Target Phase | Status | Architectural Assessment |
|---|---|---|---|---|
| F9.1 | Registered User Accounts | Phase 2 | `[Not Applicable for MVP]` | Specified in `docs/AUTH.md`. Requires user model and auth endpoints. |
| F9.2 | Cross-Device Synchronization | Phase 2 | `[Not Applicable for MVP]` | Requires account linking to replace anonymous session scoping. |
| F9.3 | Cosmetic Achievements & Ranks | Phase 2 | `[Not Applicable for MVP]` | Badges for solving mysteries without hints or on Hard difficulty. |
| F9.4 | Drag-and-Drop Evidence Board | Phase 3 | `[Not Applicable for MVP]` | Interactive canvas to pin clues and draw yarn links between suspects. |
| F9.5 | AI-Generated Evidence Imagery | Phase 3 | `[Not Applicable for MVP]` | Real generative image creation (e.g. Imagen API) instead of text descriptions. |
| F9.6 | Community Mystery Sharing | Phase 4 | `[Not Applicable for MVP]` | Public directory of player-created custom premises with leaderboard ratings. |
| F9.7 | Model Context Protocol (MCP) Integration | Future | `[Not Applicable for MVP]` | Evaluated in `docs/MCP.md`. Internal game engine does not currently use external agent tools. |

