import assert from 'node:assert/strict';
import test from 'node:test';

import { isRegistryRateLimit } from './generate-database-types.mjs';

test('recognizes registry throttling without masking other failures', () => {
  assert.equal(isRegistryRateLimit('docker: toomanyrequests: Rate exceeded'), true);
  assert.equal(isRegistryRateLimit('429 Too Many Requests'), true);
  assert.equal(isRegistryRateLimit('Database types are out of date.'), false);
});
