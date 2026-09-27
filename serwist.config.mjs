import { readFileSync } from 'node:fs';
import { serwist } from '@serwist/next/config';

import { getOfflinePrecacheFiles } from './scripts/offline-precache.mjs';

export default serwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  precachePrerendered: false,
  globPatterns: getOfflinePrecacheFiles(),
  // Public images are cached on demand by runtimeCaching; precaching them stalls SW install.
  // Same-commit rebuilds can change chunk URLs too; keep the fallback HTML in sync.
  additionalPrecacheEntries: [
    { url: '/offline/', revision: readFileSync('.next/BUILD_ID', 'utf8').trim() },
  ],
});
