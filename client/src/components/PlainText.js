import { createElement } from 'react';

export function PlainText({ as = 'span', value, ...attributes }) {
  return createElement(as, attributes, value == null ? '' : String(value));
}
