'use client';

import { useEffect } from 'react';

import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { useEditMode } from '@/context/EditModeContext';

export function usePublishedRevision(
  entityType: PublishableEntityType,
  revision?: `v1:${string}`
): void {
  const { registerPublishedRevision } = useEditMode();

  useEffect(() => {
    if (!revision) return undefined;
    return registerPublishedRevision(entityType, revision);
  }, [entityType, registerPublishedRevision, revision]);
}
