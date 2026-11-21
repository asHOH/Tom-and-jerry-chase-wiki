import { execFileSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

test('checked-in history indexes match the canonical timeline', () => {
  execFileSync(process.execPath, [
    fileURLToPath(new URL('./generate-history-dates.mjs', import.meta.url)),
    '--check',
  ]);
});
