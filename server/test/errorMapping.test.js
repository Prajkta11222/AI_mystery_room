import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middleware/errors.js';

function mapError(error) {
  const response = { statusCode: 200, headers: {}, body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(body) { this.body = body; return this; },
  };
  errorHandler(error, { id: 'test-request' }, response, () => {});
  return response;
}

test('provider quota exhaustion remains distinguishable from application failures', () => {
  const provider = mapError(Object.assign(new Error('provider failure details are private'), { status: 429, code: 'AI_RATE_LIMITED', retryAfterMs: 2_400_000 }));
  assert.equal(provider.statusCode, 429);
  assert.equal(provider.body.error.code, 'AI_RATE_LIMITED');
  assert.equal(provider.headers['Retry-After'], '30', 'retry guidance is capped to a reasonable client delay');
  assert.doesNotMatch(JSON.stringify(provider.body), /provider failure details/);

  const database = mapError(Object.assign(new Error('database connection detail'), { status: 500, code: 'ECONNREFUSED' }));
  assert.equal(database.statusCode, 500);
  assert.equal(database.body.error.code, 'SERVER_ERROR');
  assert.doesNotMatch(JSON.stringify(database.body), /database connection detail|ECONNREFUSED/);
});
