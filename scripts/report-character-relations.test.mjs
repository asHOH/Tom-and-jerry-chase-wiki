import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const projectDir = fileURLToPath(new URL('..', import.meta.url));

test('relation report runs against the checked-in data in JSON and text modes', async () => {
  const [json, text] = await Promise.all(
    [['--json'], []].map((args) =>
      execFileAsync(process.execPath, ['scripts/report-character-relations.mjs', ...args], {
        cwd: projectDir,
      })
    )
  );
  const report = JSON.parse(json.stdout);
  assert.equal(report.valid, true);
  assert.ok(report.totalTraits > 0);
  assert.equal(report.uniqueEdgeKeys, report.totalTraits);
  assert.equal(
    Object.values(report.relationKindCounts).reduce((sum, count) => sum + count, 0),
    report.totalTraits
  );
  assert.deepEqual(report.duplicateErrors, []);
  assert.deepEqual(report.contradictoryErrors, []);
  assert.match(text.stdout, new RegExp(`Traits: ${report.totalTraits}`));
});
