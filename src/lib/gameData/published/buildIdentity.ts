import 'server-only';

const embeddedBuildIdentity = process.env.TJWIKI_BUILD_IDENTITY;

if (!embeddedBuildIdentity) {
  throw new Error('TJWIKI_BUILD_IDENTITY was not embedded by next.config.ts');
}

/**
 * Opaque identity generated once while next.config.ts evaluates for this artifact.
 * It is intentionally server-only and must remain identical to Next's build ID.
 */
export const PRODUCTION_BUILD_IDENTITY = embeddedBuildIdentity;
