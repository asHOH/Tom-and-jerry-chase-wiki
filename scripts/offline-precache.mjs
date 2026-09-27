import { readFileSync } from 'node:fs';
import path from 'node:path';

// These are the deliberately warmed pages, plus the offline fallback. Everything else
// is cached as visited. Follow lazy chunk references so their controls also work offline.
// ponytail: relies on Turbopack's literal chunk paths; use its build graph if that format changes.
export function getOfflinePrecacheFiles(distDir = '.next') {
  const files = new Set();
  const collect = (contents) => {
    for (const match of contents.matchAll(/(?:\/_next\/)?static\/[\w./~-]+\.(?:js|css)/g)) {
      const asset = match[0].replace(/^\/_next\//, '');
      if (!asset.split('/').includes('..')) files.add(`${distDir}/${asset}`);
    }
  };
  for (const page of ['index', 'factions/cat', 'factions/mouse', 'offline']) {
    const html = readFileSync(path.join(distDir, 'server/app', `${page}.html`), 'utf8');
    // RSC inline data can contain article text; only inspect actual asset tags in HTML.
    for (const match of html.matchAll(
      /<(?:script|link)\b[^>]*\b(?:src|href)="(\/_next\/static\/[^"<>]+)"/g
    )) {
      collect(match[1]);
    }
  }
  if (files.size === 0) throw new Error('No startup page assets found for offline precaching');
  // Set iteration visits newly added dependencies as well.
  for (const file of files) collect(readFileSync(file, 'utf8'));
  return [...files].sort();
}
