import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlainText } from '../src/components/PlainText.js';

test('untrusted evidence is rendered as escaped text, not executable markup', () => {
  const payload = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  const html = renderToStaticMarkup(createElement(PlainText, { as: 'div', value: payload }));

  assert.equal(html.includes('<img'), false);
  assert.equal(html.includes('<script'), false);
  assert.match(html, /&lt;img/);
  assert.match(html, /&lt;script/);
});
