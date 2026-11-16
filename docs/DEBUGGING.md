# Troubleshooting & Operational Diagnostics — AI Mystery Room

**Document Version:** 2.1  
**Project:** AI Mystery Room  
**Status:** Implemented Baseline  

---

## 1. Structured Logging Schema

The backend writes all operational and security telemetry directly to `stdout` / `stderr` formatted as single-line JSON objects. This format integrates directly with cloud log aggregation systems (e.g., Render, Datadog, CloudWatch).

### Key Log Events & Payloads

#### 1. Gemini Request Success
```json
{
  "event": "case_generation_success",
  "requestId": "4d166418-fefb-4dc9-9807-6869e59d48b1",
  "model": "gemini-2.5-flash",
  "attempts": 1,
  "retryCount": 0,
  "validationFailures": 0,
  "durationMs": 4250
}
```

#### 2. Gemini Upstream Failure
```json
{
  "event": "gemini_request_failure",
  "requestId": "4d166418-fefb-4dc9-9807-6869e59d48b1",
  "category": "provider",
  "providerStatus": 429,
  "retryAfterMs": 15000
}
```

#### 3. Gemini Retry Skipped (Exceeded Wait Bound)
```json
{
  "event": "gemini_retry_skipped",
  "requestId": "4d166418-fefb-4dc9-9807-6869e59d48b1",
  "providerStatus": 429,
  "retryAfterMs": 45000,
  "requiredWaitMs": 45000,
  "maxRetryDelayMs": 30000
}
```

#### 4. Case Generation Permanent Failure
```json
{
  "event": "case_generation_failed",
  "requestId": "4d166418-fefb-4dc9-9807-6869e59d48b1",
  "model": "gemini-2.5-flash",
  "attempts": 3,
  "retryCount": 2,
  "validationFailures": 1,
  "failureCategory": "provider_rate_limited",
  "providerStatus": 429,
  "durationMs": 28400
}
```

#### 5. Database Connection Diagnostics
```json
{
  "event": "mongodb_connection_failed",
  "errorName": "MongooseServerSelectionError",
  "errorCode": "ECONNREFUSED",
  "dnsServersConfigured": false,
  "serverSelectionTimeoutMs": 8000
}
```

---

## 2. Common Operational Issues & Diagnostic Recipes

### 2.1 Issue: MongoDB Connection Failed (`ECONNREFUSED` / Server Selection Timeout)
- **Symptoms:** Server startup crashes or `caseFlow.test.js` reports:
  ```text
  MongooseServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
  ```
- **Diagnostics:**
  1. Check if the local MongoDB daemon is running:
     ```bash
     # Linux / macOS
     ps aux | grep mongod
     # Windows PowerShell
     Get-Service MongoDB
     ```
  2. If using MongoDB Atlas, check your outbound IP whitelist in the Atlas console under **Network Access**.
  3. If deploying to cloud containers where Atlas SRV resolution fails, configure DNS resolver IPs in `.env`:
     ```env
     MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1
     ```

---

### 2.2 Issue: `AI_RATE_LIMITED` (429) or `GENERATION_BUSY` (429)
- **Symptoms:** User sees toast: *"Gemini is temporarily rate-limited or its quota is exhausted."*
- **Diagnostics:**
  1. Inspect response headers: Check the `Retry-After` header returned in the API response.
  2. Differentiate between application concurrency gate and upstream provider rate limit:
     - `GENERATION_BUSY`: Triggered when `activeGenerations >= MAX_CONCURRENT_GENERATIONS`. Wait 3 seconds and retry.
     - `AI_RATE_LIMITED`: Triggered when the upstream Google AI Studio quota is exhausted. Check quota quotas in Google AI Studio.
  3. If using `gemini-2.5-flash` or `gemini-3.5-flash-lite`, verify that requests are distributed and consider configuring higher quota tiers.

---

### 2.3 Issue: `AI_INVALID_RESPONSE` (502)
- **Symptoms:** User receives: *"The AI service returned a case that did not pass validation. Please retry."*
- **Root Cause:** The LLM failed to adhere to the Zod schema or logical constraints (e.g., missing weakening clue or invalid ISO timestamps) across all 3 bounded self-repair attempts.
- **Diagnostics:**
  1. Search server logs for `requestId` and check `validationFailures`.
  2. Verify that the configured model (`GEMINI_MODEL`) is a high-capability model. Older or smaller parameter models may struggle to output 100% compliant JSON structures consistently. Recommended models: `gemini-2.5-flash`, `gemini-3.8-flash`.

---

### 2.4 Issue: `ORIGIN_NOT_ALLOWED` (403)
- **Symptoms:** Frontend POST/PATCH mutations fail with status 403.
- **Root Cause:** The `Origin` HTTP request header does not exactly match `CLIENT_ORIGIN`.
- **Diagnostics:**
  1. Check backend `.env`: In production, `CLIENT_ORIGIN` must be an exact HTTPS origin without trailing slash or path (e.g., `https://mystery.vercel.app`, NOT `https://mystery.vercel.app/`).
  2. In development, confirm `CLIENT_ORIGIN=http://localhost:5173`.

---

### 2.5 Issue: Session Cookies Not Persisting Across Requests
- **Symptoms:** Notes and reviewed evidence do not save across page refreshes; each request appears to generate a new session.
- **Root Cause:**
  - Browser blocking third-party cookies if frontend and backend domains differ without proxy.
  - In production, `Secure` cookie flag requires HTTPS.
- **Diagnostics:**
  1. In production, ensure traffic routes through the Vercel API proxy (`client/api/[...path].js`).
  2. Verify that `API_ORIGIN` is correctly set in Vercel.
  3. Inspect the browser DevTools > Storage > Cookies tab to confirm `mystery_session` is present with `HttpOnly` and `SameSite=Lax`.

---

### 2.6 Issue: `[vite] http proxy error: /api/cases AggregateError [ECONNREFUSED]`
- **Symptoms:** Vite terminal outputs proxy errors: `AggregateError [ECONNREFUSED] at internalConnectMultiple`. Browser network requests to `/api/cases` fail or return 500/503.
- **Root Causes:**
  1. **Dual Stack / IPv6 on Windows:** Node's `internalConnectMultiple` attempts to resolve `localhost` to `::1` (IPv6) first. If the Express server listens on IPv4 only, the connection is refused.
  2. **c-ares SRV DNS resolution failure:** On Windows environments where UDP port 53 is restricted or ISP DNS blocks SRV queries, `mongodb+srv://` URIs fail with `querySrv ETIMEOUT`. If `server.js` does not handle startup connection failures gracefully, the Express process crashes before port 5000 is opened.
- **Fix Applied:**
  1. Vite proxy target updated to explicit IPv4 loopback `http://127.0.0.1:5000` with `changeOrigin: true` and an error callback returning HTTP 503 `BACKEND_UNAVAILABLE` JSON.
  2. Backend `server.js` binds to `0.0.0.0`, wraps database connection with non-blocking retry loop, and returns HTTP 503 `DATABASE_UNAVAILABLE` instead of generic 500 errors when offline.
  3. `.env` updated with standard replica set endpoints for direct, resilient connection without SRV lookup.

---

## 3. Useful Health Check & Diagnostic Commands

### Query API Health Endpoint
```bash
curl -i http://localhost:5000/api/health
```
*Expected Output:* `HTTP/1.1 200 OK` with body `{"status":"ok"}`.

### Verify Session Cookie Issuance
```bash
curl -i http://localhost:5000/api/cases
```
*Expected Output:* Response includes header:
`Set-Cookie: mystery_session=v2...; Path=/; HttpOnly; SameSite=Lax`

### Inspect MongoDB Collections via `mongosh`
```javascript
use ai_mystery_room;

// Inspect total cases
db.mysterycases.countDocuments();

// Check TTL indexes
db.mysterycases.getIndexes();
db.casesolutions.getIndexes();

// Verify that solutions are never stored inside mysterycases
db.mysterycases.findOne({ "solution": { $exists: true } }); // Must return null
```

