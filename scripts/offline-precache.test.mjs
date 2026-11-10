import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { getOfflinePrecacheFiles } from './offline-precache.mjs';

for (const layout of ['app', 'route-cache']) {
  test(`precaches startup dependencies from ${layout}, including lazy chunks, without unrelated routes`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'tjwiki-precache-'));
    const dist = directory.replaceAll('\\', '/');
    const write = (file, contents) => {
      const target = path.join(directory, file);
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, contents);
    };
    const pages = ['index', 'factions/cat', 'factions/mouse', 'offline'];
    const htmlPath = (page, index) =>
      layout === 'app'
        ? `server/app/${page}.html`
        : `server/route-cache/APP_PAGE/${String(index).padStart(64, '0')}/$/${page}.html`;
    try {
      for (const [index, page] of pages.entries()) {
        write(
          htmlPath(page, index),
          `<script src="/_next/static/chunks/page-${index}.js"></script><script src="/_next/static/chunks/core.js"></script><link href="/_next/static/chunks/style.css" rel="stylesheet"><p>static/chunks/not-an-asset.js</p><script src="/_next/static/../../outside.js"></script>`
        );
        write(`static/chunks/page-${index}.js`, '');
      }
      write('static/chunks/core.js', 'import("static/chunks/lazy.js")');
      write('static/chunks/lazy.js', 'import("static/chunks/core.js")');
      write('static/chunks/style.css', 'body { color: black }');
      write('static/chunks/admin.js', 'unused admin code');
      assert.deepEqual(
        getOfflinePrecacheFiles(dist),
        ['core.js', 'lazy.js', ...pages.map((_, index) => `page-${index}.js`), 'style.css'].map(
          (file) => `${dist}/static/chunks/${file}`
        )
      );
      write('static/chunks/lazy.js', 'import("static/chunks/missing.js")');
      assert.throws(() => getOfflinePrecacheFiles(dist), /ENOENT/);
      unlinkSync(path.join(directory, htmlPath('index', 0)));
      assert.throws(() => getOfflinePrecacheFiles(dist), /precache HTML file for index, found 0/);
      write(htmlPath('index', 0), '');
      write(`server/route-cache/APP_PAGE/${'f'.repeat(64)}/$/index.html`, '');
      assert.throws(() => getOfflinePrecacheFiles(dist), /precache HTML file for index, found 2/);
    } finally {
      assert.equal(path.dirname(directory), path.resolve(tmpdir()));
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
