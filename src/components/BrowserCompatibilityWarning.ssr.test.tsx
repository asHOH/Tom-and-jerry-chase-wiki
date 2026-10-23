/** @jest-environment node */

import { renderToString } from 'react-dom/server';

import BrowserCompatibilityWarning from './BrowserCompatibilityWarning';

it('renders no browser-specific markup without browser globals on the server', () => {
  expect(renderToString(<BrowserCompatibilityWarning />)).toBe('');
});
