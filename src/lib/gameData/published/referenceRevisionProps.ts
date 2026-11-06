import { referenceDomains } from '@/lib/referenceSources';

import type { PublishedRevision } from './revision';

type Revisions = Partial<Record<(typeof referenceDomains)[number], PublishedRevision>>;
const buildRevisions: Revisions = JSON.parse(process.env.TJWIKI_REFERENCE_BUILD_REVISIONS || '{}');

export function packReferenceRevisions(revisions: Revisions) {
  return Object.fromEntries(
    Object.entries(revisions).filter(
      ([key, value]) => value !== buildRevisions[key as keyof Revisions]
    )
  ) as Revisions;
}

export function restoreReferenceRevisions(overrides: Revisions, primary: keyof Revisions) {
  const revisions = { ...buildRevisions, ...overrides };
  delete revisions[primary];
  return revisions;
}
