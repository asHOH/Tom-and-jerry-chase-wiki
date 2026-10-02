import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

test('pre-push entry points share checks, honor mode precedence, and propagate failures', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'tjwiki-pre-push-'));
  const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
  try {
    writeFileSync(
      path.join(directory, 'git'),
      '#!/bin/sh\ncase "$1" in branch) echo "$TEST_BRANCH";; rev-parse) exit 1;; esac\n',
      { mode: 0o755 }
    );
    writeFileSync(
      path.join(directory, 'npm'),
      '#!/bin/sh\necho "npm $*"\n[ "$2" != "$FAIL_CHECK" ]\n',
      { mode: 0o755 }
    );
    for (const [entry, branch, forceFull, expected] of [
      ['pre-push', 'develop', '', 'test:changed'],
      ['pre-push', 'main', '', 'test:ci'],
      ['pre-push', 'develop', 'true', 'test:ci'],
      ['pre-push-fast', 'main', '', 'test:changed'],
      ['pre-push-fast', 'main', 'true', 'test:ci'],
    ]) {
      for (const failCheck of ['', 'lint', 'prettier:check', 'type-check', expected]) {
        const result = spawnSync(
          bash,
          [
            '-c',
            'TEST_BIN=$(cd "$TEST_BIN" && pwd) || exit; export PATH="$TEST_BIN:$PATH"; sh "$1"',
            '--',
            `.husky/${entry}`,
          ],
          {
            encoding: 'utf8',
            windowsHide: true,
            env: {
              ...process.env,
              TEST_BIN: directory.replaceAll('\\', '/'),
              TEST_BRANCH: branch,
              FORCE_FAST_PREPUSH: '',
              FORCE_FULL_PREPUSH: forceFull,
              FAIL_CHECK: failCheck,
            },
          }
        );
        assert.equal(result.status, failCheck ? 1 : 0, result.stdout + result.stderr);
        if (!failCheck) {
          assert.ok(result.stdout.includes('npm run prettier:check'));
          assert.ok(result.stdout.includes('npm run type-check'));
          assert.ok(result.stdout.includes(`npm run ${expected}`));
          assert.ok(
            !result.stdout.includes(
              `npm run ${expected === 'test:ci' ? 'test:changed' : 'test:ci'}`
            )
          );
        }
      }
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
