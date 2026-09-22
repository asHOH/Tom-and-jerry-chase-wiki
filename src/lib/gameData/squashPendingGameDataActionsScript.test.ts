import { spawnSync } from 'node:child_process';
import path from 'node:path';

it.each(['--apply', '--apply=true'])('rejects retired squash mutation flag %s', (flag) => {
  const result = spawnSync(
    process.execPath,
    [path.join(process.cwd(), 'scripts/squash-pending-game-data-actions.mjs'), flag],
    { encoding: 'utf8', windowsHide: true, timeout: 10_000 }
  );

  expect(result.error).toBeUndefined();
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('--apply has been retired');
  expect(result.stdout).not.toContain('Found');
});
