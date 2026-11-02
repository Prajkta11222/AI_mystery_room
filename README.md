# AI Mystery Room

An AI-generated fictional investigation game built with React, Express, MongoDB, and Gemini. Cases are fictional. The canonical solution is stored separately and never sent to the browser until the player submits a final accusation.

## Requirements

- Node.js 20+
- MongoDB 6+ (local or hosted)
- A Gemini API key for case generation

## Setup

1. Copy `.env.example` to `.env` and configure `MONGODB_URI`, a random `SESSION_SECRET` (32+ characters), and `GEMINI_API_KEY`.
2. Install dependencies: `npm install`, `npm install --prefix server`, and `npm install --prefix client`.
3. Start both applications with `npm run dev`.
4. Open `http://localhost:5173`. The API listens on port 5000 by default.

Run the backend and frontend security/regression tests with `npm test` and create a production client bundle with `npm run build`. The backend integration test needs a reachable local MongoDB instance; it uses a separate `ai_mystery_room_e2e` database. Check dependency advisories with `npm audit`, `npm audit --prefix server`, and `npm audit --prefix client`.

Get a Gemini API key through Google AI Studio. Keep it in the server `.env`; never add a `VITE_` prefix or commit the file. The client proxies `/api` to the local server in development.

## Configuration

See `.env.example`. In production, set `NODE_ENV=production`, use HTTPS, configure a strong session secret, MongoDB, the exact trusted `CLIENT_ORIGIN`, and a supported Gemini model. `GEMINI_THINKING_LEVEL` defaults to `low` for Gemini 3+ models to reduce latency; `GEMINI_TIMEOUT_MS` defaults to 90 seconds per provider attempt and is capped at 180 seconds. `GEMINI_MAX_RETRY_DELAY_MS` defaults to 30 seconds and bounds how long the server will wait for a provider retry: it never retries before `Retry-After`, and returns a safe 429/503 response when the provider asks for a longer delay. Case generation makes at most three provider attempts. The anonymous signed session cookie is HttpOnly, SameSite=Lax, Secure, and expires in 30 days. Anonymous investigations and private solutions expire after 30 days through MongoDB TTL indexes; users can delete individual cases from the browser-session library sooner. Cases are scoped to the browser session that created them. Set `TRUST_PROXY_HOPS` only to the known number of trusted reverse proxies in front of the server; leave it at `0` when the server is directly exposed.

The MVP supports English, Hindi (Devanagari), and Hinglish (Romanized Hindi), random or custom fictional premises, six mystery categories, Easy/Medium/Hard difficulty, and Short/Medium/Long case length. Each investigation supports up to three ordered hints derived from its validated solution evidence. The selected interface language is stored in browser local storage; each case retains its original generation language. Anonymous case history is tied to that browser session and is not synchronized across devices.

The production client build includes a Content Security Policy in its HTML. Configure the static hosting service to also send the security headers listed in `client/vite.config.js`, especially `X-Frame-Options` and `Content-Security-Policy`, because meta policies cannot enforce every response-header directive.

## Deployment

Deploy `server/` to a Node.js backend host and `client/` as a Vite project on Vercel. Set the Vercel project's Root Directory to `client`, then set the non-secret `API_ORIGIN` environment variable to the backend's HTTPS origin (scheme and host only). The Vercel serverless proxy in `client/api/[...path].js` forwards `/api/*` requests through the site origin, preserving the anonymous session cookie; `client/vercel.json` serves the SPA for client routes and applies browser security headers. Set the backend's `CLIENT_ORIGIN` to the exact stable Vercel site origin, and configure `MONGODB_URI`, `MONGODB_DNS_SERVERS`, `GEMINI_API_KEY`, `GEMINI_MODEL`, and a strong `SESSION_SECRET` only on the backend host. Do not deploy the repository root as a backend on Vercel; the Express server is intended for a persistent Node.js host.

### Required production variables

Backend variables belong in the Render web service. Frontend variables belong in the Vercel project. Never put backend secrets in Vercel or `client/.env`.

| Variable | Host | Required | Where to obtain / configure |
| --- | --- | --- | --- |
| `NODE_ENV` | Render | Yes | Set to `production` in Render Environment. |
| `CLIENT_ORIGIN` | Render | Yes | The exact HTTPS Vercel origin, with no path or trailing slash. Copy it from the Vercel production domain. |
| `MONGODB_URI` | Render | Yes | MongoDB Atlas: Database > Connect > Drivers. Create a least-privilege database user and URL-encode credentials in the URI. |
| `SESSION_SECRET` | Render | Yes | Generate a unique random value of at least 32 characters. Store it only as a Render secret environment variable. |
| `GEMINI_API_KEY` | Render | Yes | Google AI Studio API key. Store it only in Render; never prefix it with `VITE_` or expose it to Vercel. |
| `GEMINI_MODEL` | Render | Yes | A supported Gemini model available to the configured API key; use the exact model identifier. |
| `API_ORIGIN` | Vercel | Yes | The Render backend's HTTPS origin, scheme and host only, for example `https://api.example.com`. |
| `PORT` | Render | No | Render supplies this automatically. The server reads it; do not hardcode a production port. |
| `MONGODB_DNS_SERVERS` | Render | No | Leave blank unless Render cannot resolve the Atlas SRV record; then provide up to three resolver IPs. |
| `TRUST_PROXY_HOPS` | Render | No | Default `0`. Set only to the known number of trusted proxies in front of Render. |
| `GEMINI_THINKING_LEVEL` | Render | No | Defaults to `low`; set only when supported by the selected model. |
| `GEMINI_TIMEOUT_MS` | Render | No | Defaults to `90000`; maximum `180000`. |
| `GEMINI_MAX_RETRY_DELAY_MS` | Render | No | Defaults to `30000`; maximum `180000`. |

The remaining rate-limit and generation-limit variables in `.env.example` are optional operational tuning controls and can remain at their defaults.

### Ordered deployment procedure

1. **MongoDB Atlas:** Create the production cluster and a least-privilege application database user. Add the backend host's outbound IP range under Network Access. Prefer Render static outbound IPs where available; do not use `0.0.0.0/0` unless temporarily required and explicitly risk-accepted.
2. **Render:** Create a Web Service for this repository with Root Directory `server`, Build Command `npm ci`, Start Command `npm start`, and Health Check Path `/api/health`. Add the backend variables above, including the Atlas URI, Gemini key/model, exact future Vercel origin, and generated session secret.
3. **Render verification:** Wait for the service to become healthy and verify `https://<backend-origin>/api/health` returns only `{"status":"ok"}`. Do not use the backend origin as the browser's API URL.
4. **Vercel:** Import the same repository with Root Directory `client`, Framework Preset `Vite`, Install Command `npm ci`, Build Command `npm run build`, and Output Directory `dist`. Add `API_ORIGIN` for Production and Preview environments as appropriate.
5. **Origin finalization:** Once the production Vercel domain is known, set Render `CLIENT_ORIGIN` to that exact origin and redeploy the backend. Keep the Vercel proxy and backend on HTTPS so the HttpOnly `SameSite=Lax` session cookie remains usable.
6. **Staging smoke test:** Open the Vercel site, create a case, refresh it, save a note, request a hint, and complete one accusation. Confirm browser Network requests use `/api/*`, no Gemini or MongoDB credentials appear in frontend assets, and the backend logs contain no secrets.
7. **Rollback:** On either host, revert to the last known-good deployment/build. If rotating `SESSION_SECRET`, expect existing anonymous sessions to be invalidated; do not rotate it for an ordinary frontend rollback.

## Product safeguards

- Scenario input is limited to 30–1,000 trimmed characters and screened for real-person accusation requests.
- Model JSON is checked before persistence; invalid generation gets bounded repair attempts.
- Case and solution are separate MongoDB documents. Player routes serialize only public fields.
- Notes and reviewed evidence persist. Accusations are one-time and idempotent.
- All cases and evidence are fictional; missing visuals use labeled text cards.

## Project layout

- `client/`: React + Vite user interface
- `server/`: Express API, MongoDB models, Gemini generation and validation
- `spec.md`: product and engineering source of truth
