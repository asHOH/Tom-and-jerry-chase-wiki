// @ts-check
import { spawnSync } from 'node:child_process';
import { serwist } from '@serwist/next/config';

// Get git revision for cache busting (falls back to UUID if git not available)
const getRevision = () => {
  try {
    const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' });
    return result.stdout?.trim() || crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
};

const revision = getRevision();

export default serwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  // Precache the offline fallback page with revision for cache busting
  additionalPrecacheEntries: [{ url: '/offline/', revision }],
});
