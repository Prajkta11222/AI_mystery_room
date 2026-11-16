# API Specification & Contract Reference — AI Mystery Room

**Document Version:** 2.1  
**Project:** AI Mystery Room  
**Status:** Implemented Baseline  
**Base URL:** `/api` (Proxied in development via Vite; proxied in production via Vercel serverless rewrite)  
**Content-Type:** `application/json` (Request payloads limited to 32kb)  

---

## 1. Global Request & Response Conventions

### 1.1 Authentication & Session Header
All requests must include the anonymous session cookie:
- **Cookie Name:** `mystery_session`
- **Format:** `v2.<sessionId>.<expiresAt>.<hmacSignature>`
- If no cookie or an invalid signature is provided, the server automatically generates a fresh anonymous session ID, signs it, and attaches `Set-Cookie` in the HTTP response.

### 1.2 Defensive Response Headers
Every API response emits:
- `X-Request-Id`: Unique UUIDv4 assigned to the request lifecycle.
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cache-Control: no-store`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'`

### 1.3 Standard Error Envelope
All error responses adhere to the following schema:
```json
{
  "error": {
    "code": "ERROR_CODE_ENUM",
    "message": "Human-readable diagnostic or localized user guidance.",
    "requestId": "4d166418-fefb-4dc9-9807-6869e59d48b1"
  }
}
```

#### Common Error Codes
| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request payload failed Zod schema checks. |
| 400 | `FICTIONAL_SCENARIO_REQUIRED` | Premise text flagged for defamatory real-person references. |
| 400 | `INVALID_EVIDENCE` | Provided evidence ID does not belong to the targeted case. |
| 400 | `INVALID_SUSPECT` | Provided suspect ID does not belong to the targeted case. |
| 403 | `ORIGIN_NOT_ALLOWED` | Mutation request `Origin` header does not match `CLIENT_ORIGIN`. |
| 404 | `NOT_FOUND` | Case does not exist or does not belong to the caller's session. |
| 409 | `IDEMPOTENCY_KEY_REUSED` | Key reused with different input parameters. |
| 409 | `CASE_SUBMITTED` / `CASE_COMPLETED` | Attempted to mutate notes, evidence, or request hints after final accusation. |
| 409 | `HINT_OUT_OF_ORDER` | Requested a hint level skipping previous levels. |
| 429 | `RATE_LIMITED` | Express route rate limit exceeded. |
| 429 | `GENERATION_BUSY` | Active generation concurrency threshold exceeded (`Retry-After: 3`). |
| 429 | `AI_RATE_LIMITED` | Google Gemini API 429 rate limit reached. |
| 502 | `AI_INVALID_RESPONSE` | Gemini model output failed validation after 3 bounded repair attempts. |
| 502 | `AI_PROVIDER_ERROR` | Upstream Gemini network or HTTP 502 transport error. |
| 503 | `GENERATION_UNAVAILABLE` | Gemini credentials missing or upstream provider unavailable. |
| 503 | `TRANSLATION_UNAVAILABLE` | Dynamic reveal explanation translation failed after retries. |

---

## 2. API Endpoints

### 2.1 System Health
`GET /api/health`

Confirms the API process is alive. Used for hosting provider health checks (e.g., Render Web Service).

#### Response (`200 OK`)
```json
{
  "status": "ok"
}
```

---

### 2.2 Create Mystery Case
`POST /api/cases`

Initiates generative AI case synthesis. The LLM generates the suspects, evidence, timeline, and canonical solution.

- **Rate Limit:** 5 requests / 60 minutes per session.
- **Concurrency Gate:** Max 2 simultaneous generations globally.

#### Request Headers
- `Idempotency-Key` *(optional, string, 16–80 chars)*: Alphanumeric key to prevent duplicate creation on network timeouts.

#### Request Body
```json
{
  "scenario": "A rare botanical specimen disappears from a locked greenhouse hours before blooming.",
  "random": false,
  "category": "locked_room",
  "difficulty": "Medium",
  "length": "Short",
  "language": "en"
}
```

#### Field Rules
- `scenario`: Required if `random: false`. Trimmed length between 30 and 1,000 characters. Screened for real-world person allegations.
- `random`: Boolean. If `true`, `scenario` must be omitted; the server selects a seed premise from `randomPremises.js`.
- `category`: `'general' | 'locked_room' | 'art_theft' | 'disappearance' | 'historical' | 'espionage'`.
- `difficulty`: `'Easy' | 'Medium' | 'Hard'`.
- `length`: `'Short' | 'Medium' | 'Long'`.
- `language`: `'en' | 'hi' | 'hinglish'`.

#### Response (`201 Created` or `200 OK` on idempotency replay)
```json
{
  "case": {
    "id": "67323b1a8f9d0c2e9b04f112",
    "title": "The Glasshouse Enigma",
    "difficulty": "Medium",
    "length": "Short",
    "language": "en",
    "category": "locked_room",
    "status": "investigating",
    "createdAt": "2026-11-11T14:20:00.000Z",
    "completedAt": null,
    "requestedHintLevels": [],
    "brief": "A rare hybrid orchid vanishes from the conservatory.",
    "incident": "The display case lock was picked without triggering alarms.",
    "location": "Verdant Spire Conservatory",
    "dateTime": "2026-10-15T22:00:00.000Z",
    "objective": "Identify who entered the glasshouse and stole the specimen.",
    "suspects": [
      {
        "id": "s1",
        "name": "Dr. Elena Vance",
        "role": "Head Botanist",
        "profile": "Pioneered the hybrid species.",
        "relationship": "Lead researcher with master keycard access.",
        "alibi": "Claims she was calibrating climate monitors in greenhouse 4."
      }
    ],
    "timeline": [
      {
        "time": "2026-10-15T21:30:00.000Z",
        "event": "Evening security rounds complete; vault locked."
      }
    ],
    "evidence": [
      {
        "id": "e1",
        "type": "cctv",
        "title": "Corridor Feed",
        "description": "Footage from outside the conservatory.",
        "content": "A silhouette wearing a lab coat enters at 21:45.",
        "timestamp": "2026-10-15T21:45:00.000Z",
        "source": "Simulated CCTV Log",
        "suspectIds": ["s1"]
      }
    ],
    "notes": "",
    "reviewedEvidence": [],
    "submitted": false,
    "reveal": null
  }
}
```

---

### 2.3 List User Investigations
`GET /api/cases`

Retrieves all cases belonging to the calling browser session, ordered by newest first. Capped at 100 cases.

#### Response (`200 OK`)
```json
{
  "investigations": [
    {
      "id": "67323b1a8f9d0c2e9b04f112",
      "title": "The Glasshouse Enigma",
      "brief": "A rare hybrid orchid vanishes from the conservatory.",
      "difficulty": "Medium",
      "length": "Short",
      "language": "en",
      "category": "locked_room",
      "status": "investigating",
      "createdAt": "2026-11-11T14:20:00.000Z",
      "updatedAt": "2026-11-11T14:25:00.000Z",
      "completedAt": null
    }
  ]
}
```

---

### 2.4 Retrieve Single Case
`GET /api/cases/:id`

Retrieves complete public case dossier. If the case is completed, the reveal payload is included.

#### Query Parameters
- `language` *(optional)*: `'en' | 'hi' | 'hinglish'`. If specified for a completed case, translates the reveal narrative if different from the case's creation language.

#### Response (`200 OK`)
Returns `{ "case": { ...publicCase } }`.

---

### 2.5 Request Progressive Hint
`POST /api/cases/:id/hints`

Unlocks the next progressive hint grounded in the validated case solution.

- **Rate Limit:** 12 requests / 15 minutes.

#### Request Body
```json
{
  "level": 1,
  "language": "en"
}
```

#### Field Rules
- `level`: Integer `1`, `2`, or `3`. Must be requested in strict sequential order (`1`, then `2`, then `3`).
- Cannot be called once the case has been submitted.

#### Response (`200 OK`)
```json
{
  "hint": {
    "level": 1,
    "evidenceIds": ["e1"],
    "text": "Revisit “Corridor Feed”. Compare its time with the events in the case timeline."
  },
  "requestedHintLevels": [1]
}
```

---

### 2.6 Update Investigation Progress
`PATCH /api/cases/:id/progress`

Persists detective notes and evidence review status. Debounced on the client (500ms).

- **Rate Limit:** 120 requests / 15 minutes.

#### Request Body
```json
{
  "notes": "Dr. Elena claims she was in GH4, but camera feed places her at 21:45.",
  "reviewedEvidence": ["e1", "e3"]
}
```

#### Response (`200 OK`)
```json
{
  "progress": {
    "notes": "Dr. Elena claims she was in GH4, but camera feed places her at 21:45.",
    "reviewedEvidence": ["e1", "e3"]
  }
}
```

---

### 2.7 Submit Final Accusation
`POST /api/cases/:id/accusation`

Submits the player's final deduction. Atomically concludes the investigation and returns the canonical truth.

- **Rate Limit:** 10 requests / 15 minutes.

#### Request Body
```json
{
  "suspectId": "s1",
  "language": "en"
}
```

#### Response (`200 OK`)
```json
{
  "result": {
    "isCorrect": true,
    "selectedSuspectId": "s1",
    "culprit": {
      "id": "s1",
      "name": "Dr. Elena Vance"
    },
    "motive": "To publish the genetic sequence under private patent.",
    "method": "Used emergency override codes to disable local humidity sensors and extract the plant.",
    "solutionSummary": "Dr. Elena used her override clearance to steal the orchid before the patent filing.",
    "fullExplanation": "Dr. Elena's alibi fell apart when the corridor CCTV caught her entering the greenhouse during her alleged calibration window...",
    "evidenceReasoning": [
      {
        "evidenceId": "e1",
        "explanation": "Places Dr. Elena at the vault door at 21:45.",
        "implication": "supports_culprit"
      },
      {
        "evidenceId": "e2",
        "explanation": "Shows the guard's badge scan at the south gate.",
        "implication": "weakens_suspect"
      },
      {
        "evidenceId": "e3",
        "explanation": "A torn delivery receipt that belonged to an earlier courier.",
        "implication": "red_herring"
      }
    ]
  }
}
```

---

### 2.8 Delete Investigation
`DELETE /api/cases/:id`

Permanently removes both `MysteryCase` and associated `CaseSolution` records from MongoDB.

#### Response (`204 No Content`)
Empty body.

