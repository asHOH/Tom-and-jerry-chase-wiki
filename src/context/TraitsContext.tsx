'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
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
  const editRuntime = useActiveEditRuntime();
  const { isEditModeRequested, isPreviewMode, runtimeStatus } = useEditMode();
  const usesDraft = isEditModeRequested && !isPreviewMode && runtimeStatus === 'ready';
  return useOptionalEditSnapshot(
    usesDraft ? editRuntime?.stores.traits : null,
    publishedTraits
  ) as unknown as TraitsRecord;
}
