'use client';

import { createContext, useContext, type ReactNode } from 'react';

import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { useEditableDomain } from '@/hooks/useEditableGameData';
import { usePublishedRevision } from '@/hooks/usePublishedRevision';
import { useEditMode } from '@/context/EditModeContext';
import canonicalTraits from '@/data/traits';
import type { Trait } from '@/data/types';

type TraitsRecord = Record<string, Trait>;

const TraitsContext = createContext<PublishedGameDataByType['traits']>(canonicalTraits);

export function TraitsProvider({
  data,
  revision,
  children,
}: {
  data: PublishedGameDataByType['traits'];
  revision: `v1:${string}`;
  children: ReactNode;
}) {
  usePublishedRevision(revision);
  return <TraitsContext value={data}>{children}</TraitsContext>;
}

export function useTraitsData(): TraitsRecord {
  const publishedTraits = useContext(TraitsContext);
  const [editableTraits] = useEditableDomain('traits', publishedTraits);
  const { isEditModeRequested, isPreviewMode, runtimeStatus } = useEditMode();
  const usesDraft = isEditModeRequested && !isPreviewMode && runtimeStatus === 'ready';
  return (usesDraft ? editableTraits : publishedTraits) as TraitsRecord;
}
