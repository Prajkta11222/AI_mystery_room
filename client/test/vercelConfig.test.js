import test from 'node:test';
import assert from 'node:assert/strict';
import { createVercelConfig } from '../vercel-config.js';

test('Vercel config proxies API requests through the site origin and supports SPA routes', () => {
  const config = createVercelConfig('https://api.example.com');
  assert.deepEqual(config.rewrites, [
    { source: '/api/:path*', destination: 'https://api.example.com/api/:path*' },
    { source: '/(.*)', destination: '/index.html' },
  ]);
  assert.ok(config.headers[0].headers.some(({ key }) => key === 'Content-Security-Policy'));
});

test('Vercel config rejects insecure or malformed API origins', () => {
  for (const value of ['', 'not a URL', 'http://api.example.com', 'https://user:secret@api.example.com', 'https://api.example.com/path']) {
    assert.throws(() => createVercelConfig(value), /API_ORIGIN/);
  }
});
