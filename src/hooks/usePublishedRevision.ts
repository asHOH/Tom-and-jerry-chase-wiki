'use client';

import { useEffect } from 'react';

import { useEditMode } from '@/context/EditModeContext';

export function usePublishedRevision(revision?: `v1:${string}`): void {
  const { registerPublishedRevision } = useEditMode();

  useEffect(() => {
    if (!revision) return undefined;
    return registerPublishedRevision(revision);
  }, [registerPublishedRevision, revision]);
}
