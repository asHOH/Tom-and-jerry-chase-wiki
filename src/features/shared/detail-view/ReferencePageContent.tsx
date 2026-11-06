'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { restoreReferenceRevisions } from '@/lib/gameData/published/referenceRevisionProps';
import type { PackedReferencePage } from '@/lib/gameData/published/reverseReferences';
import type { PackedSection } from '@/lib/referenceProjection';
import PublishedRevisionBoundary from '@/components/PublishedRevisionBoundary';

type ReferenceCards = { sections: readonly PackedSection[] } | { draftCards: readonly ReactNode[] };
const ReferenceCardContext = createContext<ReferenceCards>({ sections: [] });
export function useReferenceCards() {
  return useContext(ReferenceCardContext);
}

export function DraftReferenceCards({
  cards,
  children,
}: {
  cards: readonly ReactNode[];
  children: ReactNode;
}) {
  return <ReferenceCardContext value={{ draftCards: cards }}>{children}</ReferenceCardContext>;
}

export default function ReferencePageContent({
  page,
  children,
}: {
  page: PackedReferencePage;
  children: ReactNode;
}) {
  const revisions = useMemo(
    () => restoreReferenceRevisions(page.relatedRevisions, page.primary),
    [page.relatedRevisions, page.primary]
  );
  return (
    <PublishedRevisionBoundary revisions={revisions}>
      <ReferenceCardContext value={page}>{children}</ReferenceCardContext>
    </PublishedRevisionBoundary>
  );
}
