import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.NODE_ENV = 'production';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/ai_mystery_room_session_test';
process.env.SESSION_SECRET = 'session-security-test-secret-with-over-32-characters';
process.env.GEMINI_API_KEY = 'test-only-gemini-credential';
process.env.GEMINI_MODEL = 'gemini-test-model';
process.env.CLIENT_ORIGIN = 'https://mystery.example.test';

const { session } = await import('../src/middleware/session.js');

function invokeSession(token) {
  const cookies = [];
  const req = { cookies: token ? { mystery_session: token } : {} };
  const res = { cookie: (...args) => cookies.push(args) };
  let nextCalled = false;
  return new Promise((resolve, reject) => {
    session(req, res, (error) => {
      if (error) return reject(error);
      nextCalled = true;
      resolve({ req, cookies, nextCalled });
    });
  });
}

test('production anonymous cookie is signed, HttpOnly, Secure, SameSite=Lax, and server-expiring', async () => {
  const first = await invokeSession();
  assert.equal(first.nextCalled, true);
  assert.equal(first.cookies.length, 1);
  const [name, value, options] = first.cookies[0];
  assert.equal(name, 'mystery_session');
  assert.match(value, /^v2\.[a-f0-9]{64}\.\d{13}\.[a-f0-9]{64}$/i);
  assert.equal(options.httpOnly, true);
  assert.equal(options.secure, true);
  assert.equal(options.sameSite, 'lax');
  assert.equal(options.path, '/');
  const expiresAt = Number(value.split('.')[2]);
  assert.ok(expiresAt > Date.now());
  assert.ok(expiresAt <= Date.now() + 30 * 24 * 60 * 60 * 1_000);
  assert.ok(options.maxAge > 0 && options.maxAge <= 30 * 24 * 60 * 60 * 1_000);

  const resumed = await invokeSession(value);
  assert.equal(resumed.req.sessionId, first.req.sessionId);
  assert.equal(resumed.cookies.length, 0);

  const tampered = await invokeSession(`${value.slice(0, -1)}${value.endsWith('0') ? '1' : '0'}`);
  assert.notEqual(tampered.req.sessionId, first.req.sessionId);
  assert.equal(tampered.cookies.length, 1);

  const expiredPayload = `v2.${first.req.sessionId}.${Date.now() - 1}`;
  const expiredSignature = createHmac('sha256', process.env.SESSION_SECRET).update(expiredPayload).digest('hex');
  const expired = await invokeSession(`${expiredPayload}.${expiredSignature}`);
  assert.notEqual(expired.req.sessionId, first.req.sessionId);
  assert.equal(expired.cookies.length, 1);
});
