import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import LegacySessionLease from '../models/LegacySessionLease.js';
import { env } from '../config/env.js';

const SESSION_COOKIE = 'mystery_session';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;
const LEGACY_TOKEN_PATTERN = /^([a-f0-9]{64})\.([a-f0-9]{64})$/i;
const VERSIONED_TOKEN_PATTERN = /^v2\.([a-f0-9]{64})\.(\d{13})\.([a-f0-9]{64})$/i;

function sign(value) {
  return createHmac('sha256', env.sessionSecret).update(value).digest('hex');
}

function signatureMatches(value, providedSignature) {
  const expected = Buffer.from(sign(value), 'hex');
  const provided = Buffer.from(providedSignature, 'hex');
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function createVersionedToken(sessionId, expiresAt) {
  const signedPayload = `v2.${sessionId}.${expiresAt}`;
  return `${signedPayload}.${sign(signedPayload)}`;
}

function issueCookie(res, sessionId, expiresAt) {
  const maxAge = Math.max(0, expiresAt - Date.now());
  res.cookie(SESSION_COOKIE, createVersionedToken(sessionId, expiresAt), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.production,
    path: '/',
    maxAge,
  });
}

function legacyLeaseId(sessionId) {
  return createHash('sha256').update(sessionId).digest('hex');
}

async function getOrCreateLegacyLease(sessionId) {
  const _id = legacyLeaseId(sessionId);
  try {
    return await LegacySessionLease.findOneAndUpdate(
      { _id },
      { $setOnInsert: { expiresAt: new Date(Date.now() + SESSION_MAX_AGE_MS) } },
      { upsert: true, new: true, lean: true },
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return LegacySessionLease.findById(_id).lean();
  }
}

async function resolveSession(token) {
  const versioned = VERSIONED_TOKEN_PATTERN.exec(token || '');
  if (versioned) {
    const [, sessionId, expiresAtText, providedSignature] = versioned;
    const expiresAt = Number(expiresAtText);
    const signedPayload = `v2.${sessionId}.${expiresAtText}`;
    if (Number.isSafeInteger(expiresAt) && expiresAt > Date.now() && signatureMatches(signedPayload, providedSignature)) {
      return { sessionId, expiresAt };
    }
    return null;
  }

  const legacy = LEGACY_TOKEN_PATTERN.exec(token || '');
  if (!legacy) return null;

  const [, sessionId, providedSignature] = legacy;
  if (!signatureMatches(sessionId, providedSignature)) return null;
  const lease = await getOrCreateLegacyLease(sessionId);
  const expiresAt = lease?.expiresAt instanceof Date ? lease.expiresAt.getTime() : new Date(lease?.expiresAt).getTime();
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return null;
  return { sessionId, expiresAt, legacy: true };
}

export function session(req, res, next) {
  resolveSession(req.cookies?.[SESSION_COOKIE])
    .then((resolved) => {
      if (resolved) {
        req.sessionId = resolved.sessionId;
        if (resolved.legacy) issueCookie(res, resolved.sessionId, resolved.expiresAt);
      } else {
        const sessionId = randomBytes(32).toString('hex');
        const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
        req.sessionId = sessionId;
        issueCookie(res, sessionId, expiresAt);
      }
      next();
    })
    .catch(next);
}
