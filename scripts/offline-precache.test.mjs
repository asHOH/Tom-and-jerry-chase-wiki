import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { getOfflinePrecacheFiles } from './offline-precache.mjs';

test('precaches startup dependencies, including lazy chunks, without unrelated routes', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'tjwiki-precache-'));
  const dist = directory.replaceAll('\\', '/');
  const write = (file, contents) => {
    const target = path.join(directory, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, contents);
  };
  try {
    for (const page of ['index', 'factions/cat', 'factions/mouse', 'offline']) {
      write(
        `server/app/${page}.html`,
        '<script src="/_next/static/chunks/core.js"></script><link href="/_next/static/chunks/style.css" rel="stylesheet"><p>static/chunks/not-an-asset.js</p><script src="/_next/static/../../outside.js"></script>'
      );
    }
    write('static/chunks/core.js', 'import("static/chunks/lazy.js")');
    write('static/chunks/lazy.js', 'import("static/chunks/core.js")');
    write('static/chunks/style.css', 'body { color: black }');
    write('static/chunks/admin.js', 'unused admin code');
    assert.deepEqual(
      getOfflinePrecacheFiles(dist),
      ['core.js', 'lazy.js', 'style.css'].map((file) => `${dist}/static/chunks/${file}`)
    );
    write('static/chunks/lazy.js', 'import("static/chunks/missing.js")');
    assert.throws(() => getOfflinePrecacheFiles(dist), /ENOENT/);
  } finally {
    assert.equal(path.dirname(directory), path.resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  }
});
