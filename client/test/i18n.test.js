import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('quota errors map to clear localized Gemini messages', () => {
  return readFile(new URL('../src/i18n.jsx', import.meta.url), 'utf8').then((source) => {
    assert.match(source, /AI_RATE_LIMITED:\s*'providerRateLimit'/);
    assert.match(source, /providerRateLimit:\s*'Gemini .*quota.*retry/i);
    assert.match(source, /providerRateLimit:\s*'Gemini .*कोटा.*retry/i);
    assert.match(source, /providerRateLimit:\s*'Gemini .*quota.*try/i);
  });
});
