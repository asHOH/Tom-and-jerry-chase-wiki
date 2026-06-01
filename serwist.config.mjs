import { spawnSync } from 'node:child_process';
import { serwist } from '@serwist/next/config';

const nextStaticGlobPattern =
  '.next/static/**/*.{js,css,html,ico,apng,png,avif,jpg,jpeg,jfif,pjpeg,pjp,gif,svg,webp,json,webmanifest}';

const getRevision = () => {
  try {
    const result = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' });
    return result.stdout?.trim() || crypto.randomUUID();
  } catch {
    return crypto.randomUUID();
  }
};

export default serwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  precachePrerendered: false,
  globPatterns: [nextStaticGlobPattern],
  // Public images are cached on demand by runtimeCaching; precaching them stalls SW install.
  additionalPrecacheEntries: [{ url: '/offline/', revision: getRevision() }],
});
