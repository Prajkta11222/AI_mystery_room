# Authentication & Session Security — AI Mystery Room

**Document Version:** 2.1  
**Project:** AI Mystery Room  
**Status:** Implemented Baseline (Anonymous Sessions) / Future Phase Specified (Registered Accounts)  

---

## 1. Anonymous Session Architecture (MVP Baseline)

To satisfy the core product tenet—**"Easy to start, zero mandatory registration"**—AI Mystery Room uses a cryptographically signed anonymous session architecture. 

```mermaid
sequenceDiagram
    autonumber
    actor Player as User Browser
    participant MW as Session Middleware (Express)
    participant DB as MongoDB (Cases & Leases)

    Player->>MW: HTTP Request (e.g., GET /api/cases)
    alt No Cookie or Invalid Signature
        MW->>MW: Generate 32 random bytes (sessionId)
        MW->>MW: Calculate expiresAt (Date.now() + 30 days)
        MW->>MW: Sign payload: HMAC-SHA256(v2.sessionId.expiresAt, SESSION_SECRET)
        MW-->>Player: Set-Cookie: mystery_session=v2...; HttpOnly; SameSite=Lax; Secure
    else Valid v2 Signed Cookie
        MW->>MW: Verify HMAC-SHA256 using timingSafeEqual()
        MW->>MW: Verify expiresAt > Date.now()
        MW->>MW: Attach req.sessionId
    else Legacy v1 Cookie
        MW->>DB: Check or create LegacySessionLease
        MW-->>Player: Upgrade cookie to v2 format
    end
    MW->>DB: Execute query filtered by { ownerSessionId: req.sessionId }
    DB-->>Player: Return user's private cases
```

---

## 2. Token Format & Cryptographic Signing

In `server/src/middleware/session.js`:

### 2.1 Version 2 Token Structure (Standard)
```text
v2.<sessionId>.<expiresAt>.<hmacSignature>
```
- `v2`: Token protocol version prefix.
- `sessionId`: 64-character hexadecimal string derived from 32 cryptographically secure random bytes (`randomBytes(32).toString('hex')`).
- `expiresAt`: 13-digit Unix timestamp in milliseconds (`Date.now() + 30 * 24 * 60 * 60 * 1000`).
- `hmacSignature`: Hexadecimal HMAC-SHA256 signature generated over the string `v2.<sessionId>.<expiresAt>` using `env.sessionSecret`.

### 2.2 Constant-Time Signature Verification
To prevent side-channel timing attacks, the signature is compared using Node's native `timingSafeEqual`:
```javascript
function signatureMatches(value, providedSignature) {
  const expected = Buffer.from(sign(value), 'hex');
  const provided = Buffer.from(providedSignature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
```

### 2.3 Legacy v1 Token Resolution & Automatic Upgrade
Prior builds issued unversioned tokens (`<sessionId>.<signature>`). The current middleware provides seamless backwards compatibility:
1. Matches token against `/^([a-f0-9]{64})\.([a-f0-9]{64})$/i`.
2. Validates HMAC against `env.sessionSecret`.
3. Looks up or creates a `LegacySessionLease` in MongoDB (`_id` is SHA-256 of `sessionId`).
4. Re-issues the session as a modern `v2` cookie, upgrading the browser automatically without interrupting user gameplay.

---

## 3. Cookie Flags & Defense-in-Depth

The cookie is issued via `res.cookie('mystery_session', ...)` with strict defensive flags:

| Flag | Setting | Purpose |
|---|---|---|
| `httpOnly` | `true` | Prevents client-side scripts from reading the cookie via `document.cookie`, mitigating XSS credential theft. |
| `sameSite` | `'lax'` | Protects against Cross-Site Request Forgery (CSRF) by withholding the cookie during cross-origin subresource fetches, while permitting top-level navigation. |
| `secure` | `env.production` | Enforces transmission exclusively over HTTPS in production environments. |
| `path` | `'/'` | Ensures the cookie is valid across all API endpoints and frontend proxy routes. |
| `maxAge` | Dynamic | Set to `Math.max(0, expiresAt - Date.now())` (up to 30 days). |

---

## 4. Case Ownership & Scoping

All case interactions enforce tenancy isolation using `req.sessionId`:

```javascript
// Reading cases
const cases = await MysteryCase.find({ ownerSessionId: req.sessionId });

// Reading single case
const doc = await MysteryCase.findOne({ _id: req.params.id, ownerSessionId: req.sessionId });

// Mutating notes or reviewed evidence
const doc = await MysteryCase.findOne({ _id: req.params.id, ownerSessionId: req.sessionId });

// Submitting accusation
const updated = await MysteryCase.findOneAndUpdate(
  { _id: doc._id, ownerSessionId: req.sessionId, submittedSuspectId: null },
  { ... }
);

// Deleting case
const doc = await MysteryCase.findOneAndDelete({ _id: req.params.id, ownerSessionId: req.sessionId });
```

### Security Invariants
- An attacker guessing a valid MongoDB `ObjectId` cannot read or tamper with another player's investigation because all database operations strictly include `{ ownerSessionId: req.sessionId }`.
- Attempting to access an unowned case returns `404 NOT_FOUND` rather than `403 FORBIDDEN`, preventing ID enumeration or existence probing.

---

## 5. Future Phase: Optional Registered User Authentication (Phase 2)

While the MVP deliberately omits user registration, the architectural roadmap accounts for optional user accounts in Phase 2.

### 5.1 Proposed Architecture
- **Auth Methods:** Passwordless Magic Links or OAuth 2.0 (Google Sign-In).
- **User Document:** `User { _id, email, displayName, createdAt, settings }`.
- **Case Ownership Migration Pattern:**
  When a user with an active anonymous session registers or logs in:
  ```javascript
  await MysteryCase.updateMany(
    { ownerSessionId: req.sessionId, ownerUserId: null },
    { $set: { ownerUserId: user._id } }
  );
  ```
- **Cross-Device Access:** Once claimed by an `ownerUserId`, cases become accessible from any device where the user authenticates.
- **Retention:** Registered cases can optionally bypass the 30-day TTL index, allowing long-term detective archive storage.

