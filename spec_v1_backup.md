# AI Mystery Room --- Product & Engineering Specification

Document status: Source of truth
Version: 1.0
Product name: AI Mystery Room
Primary stack: MongoDB, Express.js, React, Node.js (MERN)
AI provider: Google Gemini
Primary implementation agent: OpenAI Codex
Purpose: Define product behavior, architecture, data contracts,
safety rules, UI requirements, and acceptance criteria. When
implementation details are ambiguous, follow this document and prefer
the simplest secure implementation.

## 1. Product Summary

AI Mystery Room is an interactive, AI-generated investigation game. A
player provides a short fictional scenario, story premise, setting, or
mystery theme. The application uses Gemini on the backend to generate a
complete fictional case containing suspects, a culprit, a timeline,
motives, and evidence artifacts. The player inspects the evidence and
submits one suspect as the culprit. The game then reveals whether the
guess was correct and explains the solution using evidence already shown
in the case.

Evidence may include fictional chat messages, written statements,
images, CCTV-style stills or clips, logs, receipts, reports, and other
case files. Evidence must be internally consistent and generated or
simulated for the game. The application must never imply that generated
evidence is authentic or belongs to a real investigation.
Product principles

1. Fair-play mystery: the culprit and solution are fixed before
   play begins; evidence supports the solution.
1. Consistency over spectacle: evidence, timestamps, alibis, and
   character details must not contradict the canonical case unless the
   contradiction is an intentional clue.
1. No answer leakage: do not expose the culprit or hidden solution
   in player-facing content before submission.
1. Safe fictional content: all cases are fictional; do not create
   realistic accusations against real people.
1. Graceful degradation: if AI or media generation fails, the
   player can still play a text-based case.
1. Server authority: the browser must never receive the hidden
   answer before the game is submitted or otherwise completed.

## 2. Goals and Non-Goals

Goals

- Let a player create a mystery from a short prompt.
- Generate a coherent case with suspects, a timeline, evidence, and
  one definitive culprit.
- Present evidence in an engaging, responsive investigation-room
  interface.
- Let the player inspect evidence, take notes, and choose a suspect.
- Provide a post-submission verdict and a reasoning-based reveal.
- Save a case and its progress in MongoDB.
- Use Gemini for structured case generation and, where supported,
  evidence text/captions.
- Support generated or simulated visual evidence without making visual
  generation a launch blocker.

Non-goals for MVP

- Real police investigations, real-world crime reporting, or use as
  evidence in legal proceedings.
- User-to-user multiplayer, live co-op, leaderboards, public case
  publishing, or social feeds.
- Payments, subscriptions, ads, or an in-game economy.
- Real CCTV ingestion, access to WhatsApp accounts, or access to a
  user's private files.
- Guaranteed video generation. CCTV video can be represented as a
  simulated clip, storyboard, or a set of generated still frames.
- A general-purpose chatbot unrelated to the active case.

## 3. Target User and Primary Journey

Target user
A person who enjoys detective stories, escape rooms, logic puzzles, and
interactive narrative games.
Primary journey

1. User opens the landing page.
1. User enters a short scenario/premise, selects difficulty and case
   length, and starts generation.
1. Backend validates the prompt and asks Gemini to generate a
   structured canonical case.
1. Backend validates the returned structure and consistency rules. It
   retries or repairs invalid output within a bounded limit.
1. Case is saved to MongoDB. Only the player-safe case view is sent to
   the frontend.
1. User enters the investigation room and explores the case brief,
   suspects, timeline, and evidence files.
1. User records notes and can mark evidence as reviewed.
1. User selects one suspect and submits a final accusation.
1. Backend evaluates the guess against the hidden culprit.
1. Frontend shows the result, the full solution, an evidence-based
    explanation, and an option to start another case.

Key journey rules

- The player may inspect evidence in any order.
- Evidence review is optional; no evidence item is required to submit
  a guess.
- MVP allows one final accusation per case. Do not reveal whether a
  guess is correct before submission.
- If the user refreshes, saved case progress should be restored.
- The final reveal must refer only to evidence present in the case,
  not invent new decisive evidence after the guess.

## 4. MVP Scope

Required

- Landing page with product explanation and "Create a Mystery" CTA.
- Scenario input form with validation.
- Difficulty selector: Easy, Medium, Hard.
- Case length selector: Short, Standard.
- Loading/progress state during generation.
- Investigation room with case overview, suspect profiles, evidence
  viewer, timeline, notes, and accusation flow.
- Evidence types: text message/chat transcript, witness
  statement/document, image or image placeholder, and CCTV-style event
  log or still frame. At least three distinct evidence items per case.
- Final accusation and solution reveal.
- Case persistence and resume after refresh.
- Responsive desktop and mobile layouts.
- Useful loading, empty, validation, and error states.
- Backend API, Gemini integration, database persistence, and automated
  tests for critical rules.

Optional / phase 2

- Actual AI-generated images for evidence.
- Simulated CCTV clips assembled from still frames.
- Case sharing via an unguessable public link.
- User accounts, saved case library, achievements, hints, and multiple
  attempts.
- More languages and accessibility preferences.

MVP media policy
Gemini is the required AI provider for case planning and text
generation. Do not assume Gemini will return a binary image or video. If
image generation is unavailable in the configured model/API, use one of
these safe fallbacks: 1. Generate a detailed visual brief and render a
clearly labeled fictional evidence card. 2. Use a configured
image-generation provider only if one is explicitly added to environment
configuration. 3. Use a neutral placeholder with an "AI-generated visual
unavailable" label. Never silently substitute a real photograph of a
real person or present a placeholder as authentic footage.

## 5. UX and Page Specification

### 5.1 Landing page (/)

Purpose: explain the game and begin a new case. - Product name and
concise tagline. - Primary CTA: "Create a Mystery". - Short three-step
explanation: create scenario → inspect evidence → identify culprit. -
Small note: "All cases and evidence are fictional and AI-generated." -
No authentication required for MVP. - Responsive layout,
keyboard-accessible controls, clear contrast, visible focus states.

### 5.2 Create case (/create)

Fields: - Scenario (required textarea): 30--1,000 characters after
trimming. - Difficulty (required): Easy, Medium, Hard. Default
Medium. - Case length (required): Short or Standard. Default
Short. - Optional setting selector only if implemented without
clutter: Modern, Historical, Sci-fi. - Submit CTA: "Generate Case".
Validation: - Reject empty or whitespace-only prompts. - Show character
count and inline validation. - Do not accept instructions to accuse,
expose, or investigate a real person. Ask for a fictionalized premise
instead. - Do not send Gemini API keys or internal prompts to the
browser.

### 5.3 Generation state

- Show a clear progress state, such as "Building the case",
  "Connecting the clues", and "Preparing evidence".
- Do not claim a precise percentage unless actual progress is
  available.
- Prevent duplicate submissions while generation is active.
- Allow cancellation if feasible; otherwise explain that the request
  is processing.
- On failure, show a retry action without losing the user's prompt.
- Do not expose raw provider errors, stack traces, or internal
  prompts.

### 5.4 Investigation room (/case/:caseId)

Recommended layout: - Top bar: case title, difficulty badge, status,
"Exit case" action. - Case brief: summary, incident, location,
date/time, objective. - Suspects panel: each suspect's name/alias,
fictional portrait or avatar, role, public profile, known relationship
to incident. Do not expose hidden culprit fields. - Evidence locker:
cards grouped by type, with title, type icon, short description, and
reviewed/unreviewed status. - Evidence viewer: opens a drawer/modal
or dedicated panel with full content, metadata, image/media, and source
context. - Timeline: chronological events visible to the player;
preserve intentional uncertainty. - Investigator notes: private
notes stored with case progress; plain text only in MVP. - Accusation
panel: select a suspect, review selection, and submit final
accusation. - Progress indicator: reviewed evidence count may be
shown, but must not imply that all evidence has been reviewed.
Responsive behavior: stack panels on small screens; keep evidence
readable without horizontal scrolling.

### 5.5 Evidence viewer behavior

- Display evidence type, title, content, timestamp if relevant, and
  fictional source.
- Images must have alt text and a visible "AI-generated fictional
  evidence" label.
- CCTV entries must be labeled "Simulated CCTV evidence" unless a real
  video-generation pipeline exists; even then label as fictional.
- Chat transcripts must use fictional names and clearly fictional
  context.
- Allow marking an item as reviewed.
- Do not render raw HTML from AI output. Render text as escaped
  content and validate structured fields.

### 5.6 Accusation and reveal

Before submission: - Show all suspect options with clear selection
state. - Require exactly one suspect selection. - Confirm that the
accusation is final. - Do not reveal correctness before confirmation.

After submission: - Show "Correct" or "Not quite" without shaming
language. - Reveal culprit, motive, method, and chronological
explanation. - Explain at least two evidence items that support the
solution and address the strongest misleading clue. - Show the case's
canonical solution, not a new model-generated answer. - Disable further
accusations for MVP. - Offer "Play another mystery" and "Review
evidence". - If a case has already been submitted, return the existing
result rather than evaluating a new guess.

### 5.7 Accessibility and visual direction

- Use a polished detective-board aesthetic: dark neutral surfaces,
  restrained accent color, evidence cards, subtle paper/file textures,
  and strong typography.
- Avoid excessive animations, visual noise, and illegible "hacker"
  styling.
- Respect prefers-reduced-motion.
- Use semantic headings, form labels, keyboard navigation, visible
  focus indicators, and sufficient color contrast.
- Do not use color alone to communicate correct/incorrect status.
- Add loading skeletons or status messages for long operations.

## 6. Difficulty and Case Design Rules

Easy

- 3 suspects.
- 4--5 evidence items.
- One obvious but not immediately stated contradiction.
- No more than one deliberate red herring.
- Solution follows from the evidence with minimal inference.

Medium

- 4 suspects.
- 6--8 evidence items.
- At least two clues must be combined.
- One or two plausible red herrings.
- The culprit's alibi or statement has a detectable inconsistency.

Hard

- 5 suspects.
- 8--10 evidence items.
- Requires combining multiple clues and chronology.
- Two or three plausible red herrings, but no arbitrary or unfair
  twists.
- The solution remains logically provable from presented evidence.

Case invariants

- Exactly one canonical culprit.
- Every suspect has a plausible motive or reason to be considered, but
  only one satisfies the full evidence.
- The canonical solution is fixed before evidence is generated.
- Evidence may be ambiguous, but must not be impossible to reconcile
  with the canonical timeline.
- At least two independent clues should support the culprit.
- At least one clue should meaningfully weaken a non-culprit suspect.
- A red herring must be explainable in the reveal.
- Do not make the culprit identifiable only by demographic
  stereotypes, protected traits, or arbitrary narrative authority.
- Do not introduce decisive evidence in the reveal that was not
  available to the player.
- A scenario may be expanded into a fictional case, but should
  preserve the user's core premise.

Suggested generation sequence

1. Generate canonical case facts and solution privately.
1. Generate suspect profiles, timeline, motives, and alibis from those
   facts.
1. Generate evidence items that support or challenge each suspect.
1. Run consistency checks across timestamps, names, locations, and
   claims.
1. Generate player-facing summary and hints without leaking the answer.
1. Store the canonical solution separately from the player-facing case
   payload.

This sequence is a logical requirement even if implemented as one Gemini
call initially. If one call is used, the backend must still validate and
separate secret fields before responding.

## 7. AI / Gemini Requirements

Provider integration

- Use Gemini through a server-side SDK or HTTPS API.
- Choose a currently supported Gemini model via GEMINI_MODEL
  environment variable; do not hardcode a model name throughout the
  codebase.
- Read GEMINI_API_KEY only from backend environment configuration.
- Use structured JSON output/schema constraints where supported by the
  chosen model.
- Set request timeouts and bounded retry behavior.
- Log provider status and request correlation IDs, but never log API
  keys or unnecessary user content.
- Keep the AI service isolated in a module such as
  server/src/services/geminiService.js.

Prompting and validation

- Use a versioned, server-owned prompt template.
- Treat the user's scenario as untrusted data, not as instructions
  that can override system requirements.
- Ask the model to return JSON matching the case schema.
- Parse and validate the response with a runtime schema validator (Zod
  is recommended).
- Reject invalid JSON, missing fields, duplicate IDs, invalid suspect
  references, impossible timestamps, and missing culprit.
- Retry at most two times after the initial attempt, using a repair
  prompt that contains validation errors but does not expose secrets.
- If generation still fails, return a safe error and let the user
  retry. Do not persist a partially valid case.
- Validate that every culpritId references one of the generated
  suspects.
- Validate that all evidence IDs are unique and every referenced
  suspect ID exists.
- Keep solution, culpritId, and hidden reasoning out of all
  pre-submission responses.
- Never rely on the frontend to hide the answer; the server response
  must omit it.

Model output contract
Use one canonical internal case object and derive two projections: 1.
Player-safe projection: all fields the player can see before
accusation. 2. Reveal projection: culprit, motive, full solution,
and evidence reasoning, returned only after a successful accusation
submission.

Do not return internal chain-of-thought. The explanation should be a
concise, evidence-grounded narrative based on explicit case facts.
AI safety / content controls

- Keep cases fictional and clearly labeled.
- Reject or transform prompts targeting a real, identifiable person
  with allegations of criminal behavior.
- Do not generate real personal data, real phone numbers, credentials,
  or real private conversations.
- Avoid graphic violence and explicit sexual violence. Prefer suspense
  and non-graphic descriptions.
- Do not provide actionable real-world instructions for evading law
  enforcement, committing violence, or covering up a crime.
- Sanitize and validate all generated output before storage and
  rendering.

## 8. Canonical Case Data Model

The following is the logical contract. Adapt field names only if there
is a clear engineering reason, and update this specification before
changing the contract.
type Difficulty = "easy" | "medium" | "hard";
type CaseLength = "short" | "standard";
type CaseStatus = "investigating" | "solved";
type EvidenceType =
  | "chat"
  | "document"
  | "image"
  | "cctv"
  | "statement"
  | "log"
  | "other";

interface MysteryCase {
  _id: string;
  title: string;
  scenarioPrompt: string;
  difficulty: Difficulty;
  caseLength: CaseLength;
  setting: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;

  publicCase: {
    summary: string;
    incident: string;
    location: string;        // Fictional location
    incidentAt: string;      // ISO-8601 timestamp
    objective: string;
    suspects: PublicSuspect[];
    timeline: TimelineEvent[];
    evidence: EvidenceItem[];
  };

  privateSolution: {
    culpritId: string;
    motive: string;
    method: string;
    solutionSummary: string;
    fullExplanation: string;
    evidenceReasoning: Array<{
      evidenceId: string;
      explanation: string;
      implication: "supports_culprit" | "weakens_suspect" | "red_herring" | "context";
    }>;
  };

  progress: {
    reviewedEvidenceIds: string[];
    notes: string;
    accusation?: {
      suspectId: string;
      submittedAt: string;
      isCorrect: boolean;
    };
  };

  generation: {
    provider: "gemini";
    model: string;
    promptVersion: string;
    validationStatus: "passed";
  };
}

interface PublicSuspect {
  id: string;
  name: string;              // Fictional name
  role: string;
  profile: string;
  knownMotive: string;
  alibi: string;
  avatar?: {
    kind: "generated" | "placeholder";
    url?: string;
    alt: string;
  };
}

interface TimelineEvent {
  id: string;
  occurredAt: string;        // ISO-8601
  title: string;
  description: string;
  relatedSuspectIds: string[];
  relatedEvidenceIds: string[];
}

interface EvidenceItem {
  id: string;
  type: EvidenceType;
  title: string;
  summary: string;
  content: string;            // Plain text or structured textual representation
  createdAt?: string;
  occurredAt?: string;
  sourceLabel: string;        // e.g. "Fictional chat export"
  relatedSuspectIds: string[];
  media?: {
    kind: "image" | "video" | "placeholder";
    url?: string;
    alt: string;
    fictionalLabel: string;   // Must clearly indicate fictional/AI-generated content
  };
  isRedHerring: boolean;      // Internal; do not expose this flag pre-reveal
}
Data model implementation notes

- Prefer separate MongoDB documents/collections for MysteryCase and
  CaseProgress if that simplifies secret-field access control.
- Strong recommendation: store privateSolution in a separate
  CaseSolution collection keyed by caseId, with access limited to
  server-side code. The public case API should never query or
  serialize that collection before submission.
- Never trust client-supplied isCorrect, culpritId,
  isRedHerring, solution fields, timestamps, or progress ownership.
- Use MongoDB indexes on _id and createdAt; if user accounts are
  added later, index ownerId and enforce ownership checks.
- For anonymous MVP sessions, use a cryptographically random session
  identifier in an HttpOnly cookie or an unguessable case access
  token. Do not use sequential IDs as access controls.
- Do not put private solution fields in local storage or frontend
  state before reveal.

## 9. REST API Contract

Base path: /api/v1
POST /cases
Creates a new case. Request:
{
  "scenario": "A prototype disappeared from a lab during a storm.",
  "difficulty": "medium",
  "caseLength": "short",
  "setting": "modern"
}
Success 201 response:
{
  "case": {
    "id": "opaque-case-id",
    "title": "The Prototype After Midnight",
    "difficulty": "medium",
    "caseLength": "short",
    "status": "investigating",
    "summary": "A prototype vanished during a storm...",
    "incident": "A prototype was reported missing...",
    "location": "Fictional Northbridge Research Lab",
    "incidentAt": "2026-10-20T21:00:00.000Z",
    "objective": "Determine which suspect took the prototype.",
    "suspects": [],
    "timeline": [],
    "evidence": [],
    "progress": {
      "reviewedEvidenceIds": [],
      "notes": ""
    }
  }
}
The arrays above are abbreviated examples. The real response must
include the validated public data and must not contain the culprit,
private solution, internal red-herring flags, or hidden reasoning.

Errors: - 400 VALIDATION_ERROR: invalid input. -
422 UNSAFE_OR_UNSUPPORTED_PROMPT: prompt cannot be used as
submitted. - 429 RATE_LIMITED: generation limit reached. -
502 AI_PROVIDER_ERROR: provider unavailable or returned invalid output
after retries. - 500 INTERNAL_ERROR: unexpected server failure.
GET /cases/:caseId
Returns the player-safe case and progress. Never returns solution fields
before the case is solved. - 200: case exists and access is
authorized. - 404: case not found or not accessible. - 500:
unexpected error.
PATCH /cases/:caseId/progress
Updates player progress. Request:
{
  "reviewedEvidenceIds": ["evidence-1", "evidence-2"],
  "notes": "The timeline does not match the witness statement."
}
Rules: - Only accept evidence IDs that belong to the case. - Limit notes
to 5,000 characters. - Validate field types and lengths. - Ignore or
reject any unexpected properties, especially solution fields. - Return
the updated player-safe progress.
POST /cases/:caseId/accusation
Submits the final accusation. Request:
{
  "suspectId": "suspect-2"
}
Rules: - Suspect must exist in this case. - Accusation can be submitted
once. - Evaluation occurs on the backend against the stored canonical
culprit ID. - Repeated submission returns the already-saved result and
must not accept a different suspect. Success 200 response:
{
  "result": {
    "isCorrect": false,
    "selectedSuspectId": "suspect-2",
    "culprit": {
      "id": "suspect-4",
      "name": "Morgan Vale"
    },
    "motive": "They intended to sell the prototype.",
    "method": "They used an authorized maintenance window.",
    "solutionSummary": "The timeline and access record identify Morgan...",
    "fullExplanation": "The decisive clue is...",
    "evidenceReasoning": [
      {
        "evidenceId": "evidence-3",
        "explanation": "The access log places Morgan in the lab...",
        "implication": "supports_culprit"
      }
    ]
  }
}
Only this endpoint may return the reveal projection, and only after a
valid accusation is submitted.
GET /health
Returns service health without leaking secrets:
{ "status": "ok" }
API conventions

- Use consistent JSON errors:

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields."
  }
}

- Do not send stack traces or raw Gemini responses to clients.
- Use correct HTTP status codes.
- Add request IDs for tracing.
- Validate all request bodies and route parameters.
- Apply rate limiting to case generation and accusation endpoints.

## 10. Architecture and Repository Structure

Architecture

- Frontend: React + Vite, React Router, plain CSS/CSS modules or
  the project's existing styling system.
- Backend: Node.js + Express.
- Database: MongoDB with Mongoose.
- AI: Gemini API called only by the backend.
- Validation: Zod or an equivalent runtime validator.
- Testing: Vitest/React Testing Library for frontend; Node test
  runner or Jest/Vitest + Supertest for backend.
- Deployment-ready configuration: environment variables; no
  secrets committed.

Suggested repository structure
ai-mystery-room/
  client/
    src/
      app/
      components/
      pages/
        LandingPage.jsx
        CreateCasePage.jsx
        InvestigationRoomPage.jsx
        RevealPage.jsx
      features/
        cases/
        evidence/
        accusation/
      services/
        apiClient.js
      styles/
      utils/
    public/
    package.json
    vite.config.js
  server/
    src/
      config/
        env.js
        database.js
      models/
        MysteryCase.js
        CaseSolution.js
        CaseProgress.js
      routes/
        healthRoutes.js
        caseRoutes.js
      controllers/
        caseController.js
      services/
        geminiService.js
        caseGenerationService.js
        caseValidationService.js
      middleware/
        errorHandler.js
        rateLimiter.js
        requestId.js
      validators/
        caseSchemas.js
      app.js
      server.js
    tests/
    package.json
  .env.example
  .gitignore
  README.md
  SPEC.md
Codex may adapt this layout to an existing repository, but it must
preserve separation of concerns and secret-field isolation.
Frontend responsibilities

- Render pages and case data.
- Validate simple form constraints for immediate feedback.
- Track reviewed evidence and notes through the API.
- Never determine the canonical culprit or correctness.
- Never call Gemini directly from the browser.
- Never receive hidden solution fields before accusation submission.

Backend responsibilities

- Validate input and rate-limit requests.
- Call Gemini and validate output.
- Persist case and solution securely.
- Return player-safe projections.
- Manage progress and accusation state.
- Handle errors consistently.
- Enforce access control for case IDs/session tokens.

## 11. Environment Configuration

Create .env.example with placeholders only:

```env
# Server
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai_mystery_room
SESSION_SECRET=replace_with_a_long_random_secret

# Gemini
GEMINI_API_KEY=replace_me
GEMINI_MODEL=replace_with_supported_model_name

# Optional operational limits
CASE_GENERATION_RATE_LIMIT=5
CASE_GENERATION_RATE_WINDOW_MINUTES=60
MAX_SCENARIO_LENGTH=1000
```

Rules: - .env must be ignored by Git. - Fail fast on server startup if
required production variables are missing. - Never expose environment
variables with secrets through Vite's `VITE_` prefix. - Use
CLIENT_ORIGIN for CORS configuration; do not allow every origin in
production. - Document how to obtain and configure a Gemini API key
without including any real key in the repository.

## 12. Security, Privacy, and Reliability

- Validate all user input and all model output.
- Escape user and AI text; never use unsanitized
  dangerouslySetInnerHTML.
- Keep API keys server-side.
- Apply rate limits to generation and progress endpoints.
- Use secure, HttpOnly, SameSite cookies if cookies are used; enable
  Secure in production.
- Restrict case access using session ownership or a high-entropy
  access token.
- Avoid storing unnecessary personal data. MVP should not require a
  real name, email, or account.
- Do not log full private notes or secrets.
- Set timeouts and bounded retries for Gemini.
- Limit prompt length, output size, evidence count, and media payload
  size.
- Do not accept arbitrary remote media URLs from the model without
  validation. Prefer controlled storage or known trusted media
  origins.
- If media is not available, preserve evidence text and render a safe
  placeholder.
- Add a central error handler and prevent unhandled promise
  rejections.
- Return generic user-facing errors and useful server-side diagnostic
  logs without secrets.
- Clearly label generated evidence as fictional and AI-generated.
- Include a short privacy notice explaining that the submitted
  scenario is sent to an AI provider to generate the case.

## 13. Non-Functional Requirements

Performance

- Normal non-AI API requests should usually complete within 500 ms
  under local development conditions, excluding database cold starts.
- Case generation may take longer; show progress and use a
  configurable timeout.
- Avoid blocking the Node.js event loop with heavy synchronous work.
- Load evidence media lazily where appropriate.

Reliability

- A failed generation must not leave a playable, partially written
  case.
- Database writes for case + solution should be atomic where
  supported, or cleaned up if a later write fails.
- A repeated accusation request must be idempotent.
- Refreshing the investigation page must restore the same case and
  progress.
- If the database or AI provider is unavailable, return a controlled
  error.

Maintainability

- Keep routes/controllers/services/models separate.
- Use clear names and small functions.
- Centralize schema validation and API error formatting.
- Add a README with install, development, test, and deployment
  instructions.
- Keep this SPEC.md aligned with implemented behavior.

Compatibility

- Support current stable Chrome, Edge, Firefox, and Safari.
- Work at mobile and desktop widths.
- Do not depend on hover as the only way to access functionality.

## 14. Error and Empty States

- Empty scenario: inline prompt asking for a fictional premise.
- Prompt too long: inline maximum-length message.
- Unsafe real-person request: explain that the game needs a
  fictionalized scenario.
- AI timeout/provider failure: preserve form input and provide Retry.
- Invalid AI structure: retry internally; if still invalid, show a
  generic generation failure.
- Case not found/expired: show a friendly message and return to Create
  Mystery.
- Evidence media missing: display text evidence plus a clearly labeled
  placeholder.
- Progress save failure: show a retryable save status; do not silently
  discard notes.
- Invalid suspect selection: ask the player to select one suspect.
- Duplicate accusation: return the stored result; never re-evaluate
  against a different choice.
- Network disconnected: show connection state and allow retry.

## 15. Acceptance Criteria

The MVP is complete only when all of the following are true:
Case creation

- [ ] A user can submit a valid fictional scenario between 30 and
  1,000 characters.
- [ ] Difficulty and case length are persisted.
- [ ] Invalid input is rejected with a useful message.
- [ ] Gemini is called from the backend, never directly from the
  browser.
- [ ] AI output is schema-validated before persistence.
- [ ] The case includes one culprit, at least three suspects, and at
  least three evidence items.
- [ ] Case facts and evidence pass consistency validation or
  generation fails safely.

Information security

- [ ] culpritId, privateSolution, isRedHerring, and hidden
  reasoning are absent from create/get/progress responses before
  accusation.
- [ ] Gemini credentials are never present in frontend bundles or API
  responses.
- [ ] A user cannot change the culprit by editing a request.
- [ ] Case access is protected by session ownership or an unguessable
  access mechanism.
- [ ] AI/user content is rendered as text, not executable HTML.

Investigation

- [ ] Suspects, evidence, and timeline are readable and navigable.
- [ ] At least three evidence types can be displayed.
- [ ] Evidence can be marked reviewed.
- [ ] Notes persist after refresh.
- [ ] Missing media does not break the case.
- [ ] The UI clearly labels fictional/AI-generated content.

Accusation and reveal

- [ ] A player must select exactly one suspect before submitting.
- [ ] Correctness is evaluated server-side.
- [ ] The reveal explains the solution using evidence that was
  available before submission.
- [ ] The solution does not invent new decisive facts.
- [ ] Duplicate submissions return the existing result.
- [ ] The culprit is not revealed by any pre-submission endpoint or
  frontend state.

Quality

- [ ] Loading, validation, error, and empty states are implemented.
- [ ] Layout works on mobile and desktop.
- [ ] Keyboard navigation and visible focus states work.
- [ ] Critical backend and frontend behavior has automated tests.
- [ ] README and .env.example are present.
- [ ] No secrets, real API keys, or production credentials are
  committed.

## 16. Required Tests

At minimum, add automated tests for:

1. Reject blank and overlong scenario prompts.
1. Reject unsupported difficulty/case-length values.
1. Validate a well-formed Gemini response.
1. Reject a response with a missing culprit or invalid suspect
   reference.
1. Reject duplicate suspect/evidence IDs.
1. Confirm pre-submission case responses do not contain solution fields
   or red-herring flags.
1. Confirm the accusation endpoint returns the canonical reveal after a
   valid submission.
1. Confirm an invalid suspect ID is rejected.
1. Confirm repeated accusation requests return the original result and
   cannot change the selected suspect.
1. Confirm notes and reviewed evidence persist and reject evidence IDs
    that do not belong to the case.
1. Confirm provider failure returns a controlled error and does not
    create a partial case.
1. Confirm generated content is rendered safely as text.
1. Confirm rate limiting is active for generation.
1. Confirm case access checks prevent access to another session's case.

Mock Gemini in automated tests; tests must not require a real API key or
make paid/network AI calls.

## 17. Implementation Plan for Codex

Build in small, verifiable phases. Do not generate the entire
application in one unreviewed step.
Phase 1 --- Repository inspection and foundation

- Inspect existing files before modifying anything.
- Preserve working project conventions where reasonable.
- Create or verify client/server structure, package scripts,
  environment validation, database connection, health endpoint, and
  central error handling.
- Add .env.example, .gitignore, and README.

Phase 2 --- Data contracts and API

- Implement runtime schemas and Mongoose models.
- Implement case creation, retrieval, progress update, and accusation
  endpoints using mocked case data first.
- Enforce secret-field separation from the beginning.
- Add API tests.

Phase 3 --- Gemini case generation

- Implement Gemini service and versioned prompt.
- Validate and repair model output within the bounded retry policy.
- Save canonical solution separately.
- Add tests using mocked provider responses.

Phase 4 --- Core frontend

- Build landing page and create form.
- Build investigation room, suspect cards, evidence locker/viewer,
  timeline, notes, and accusation panel.
- Connect to backend through a single API client.
- Implement loading, empty, error, and responsive states.

Phase 5 --- Reveal and persistence

- Implement accusation confirmation, server submission, reveal
  page/state, and idempotent result.
- Restore case and progress after refresh.
- Verify that hidden fields never reach the client before submission.

Phase 6 --- Quality pass

- Run tests, linting, and production builds.
- Verify keyboard navigation, mobile layout, reduced motion, contrast,
  and safe rendering.
- Test missing Gemini key, provider timeout, malformed model output,
  database failure, and missing media.
- Update README and this spec if any agreed implementation detail
  changes.

Codex working rules

- Treat this document as the source of truth.
- Inspect the repository before editing; do not overwrite existing
  work blindly.
- Prefer readable, maintainable code over unnecessary abstractions.
- Do not invent external APIs or assume an image/video model is
  available.
- Do not hardcode secrets, API keys, or production URLs.
- Do not leave core functionality as a TODO, mock, or static-only
  screen.
- Mock only in tests or where an explicit fallback is specified.
- After each phase, run relevant tests/builds and fix failures before
  moving on.
- If a requirement conflicts with an existing repository constraint,
  explain the conflict and choose the safest implementation; update
  this spec only when a deliberate product decision is made.
- Do not add unrelated features outside the MVP scope.

## 18. Definition of Done

The project is ready for MVP demonstration when: 1. A user can create a
fictional mystery from a prompt. 2. Gemini-generated case data is
validated and saved. 3. The investigation room displays suspects,
timeline, and varied evidence. 4. The user can review evidence, take
notes, and submit one accusation. 5. The reveal correctly uses the
stored canonical solution and cites presented evidence. 6. Secret
solution data is not available to the browser before submission. 7. The
app handles AI, database, and media failures gracefully. 8. Critical
tests pass and the app can be started from documented setup
instructions.

## 19. Product Decisions and Explicit Assumptions

These decisions are intentional for the MVP: - No login is required; use
secure anonymous session/case access. - One final accusation is allowed
per case. - The app uses a fictional, non-graphic mystery format. -
Gemini is used for case generation and text; actual image/video
generation is optional and must be explicitly configured. - CCTV
evidence can be represented as simulated logs or stills. - The case's
canonical solution is generated and validated before gameplay. - MongoDB
stores the case and progress; private solution data should be stored
separately from public case data. - The first release prioritizes
logical consistency and gameplay over elaborate media generation.

Change control: If a product requirement changes, update this
document first, then update implementation and tests. Keep SPEC.md in
the repository root as the authoritative specification.
