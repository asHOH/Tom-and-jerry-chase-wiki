import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { isRegistryRateLimit } from './generate-database-types.mjs';

test('recognizes registry throttling without masking other failures', () => {
  assert.equal(isRegistryRateLimit('docker: toomanyrequests: Rate exceeded'), true);
  assert.equal(isRegistryRateLimit('429 Too Many Requests'), true);
  assert.equal(isRegistryRateLimit('Database types are out of date.'), false);
});

test('check mode reports drift without rewriting the committed types', () => {
  const target = new URL('../src/data/database.generated.ts', import.meta.url);
  const current = readFileSync(target, 'utf8');

  for (const drift of [false, true]) {
    // Replace only the external generator so this check does not need Docker.
    const preload = `
      import childProcess from 'node:child_process';
      import { readFileSync } from 'node:fs';
      import { syncBuiltinESMExports } from 'node:module';
      childProcess.execFileSync = () => readFileSync(new URL(${JSON.stringify(target.href)}), 'utf8')
        + ${JSON.stringify(drift ? '\n// Simulated schema drift\n' : '')};
      syncBuiltinESMExports();
    `;
    const result = spawnSync(
      process.execPath,
      [
        '--import',
        `data:text/javascript,${encodeURIComponent(preload)}`,
        fileURLToPath(new URL('./generate-database-types.mjs', import.meta.url)),
        '--check',
      ],
      { encoding: 'utf8' }
    );

    assert.ifError(result.error);
    assert.equal(result.status, drift ? 1 : 0, result.stderr);
    if (drift) {
      assert.match(result.stderr, /--- committed\/database.generated.ts/);
      assert.match(result.stderr, /\+\+\+ generated\/database.generated.ts/);
      assert.match(result.stderr, /\+\/\/ Simulated schema drift/);
    }
    assert.equal(readFileSync(target, 'utf8'), current);
  }
});
