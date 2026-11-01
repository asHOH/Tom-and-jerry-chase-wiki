'use client';

import { useEffect, type ReactNode } from 'react';

import {
  PUBLISHABLE_ENTITY_TYPES,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import type { PublishedRevision } from '@/lib/gameData/published/revision';
import { useEditMode } from '@/context/EditModeContext';

type PublishedRevisionBoundaryProps = {
  revisions: Partial<Record<PublishableEntityType, PublishedRevision>>;
  children: ReactNode;
};

/** Registers the additional domain dependencies of a page that renders several domains. */
export default function PublishedRevisionBoundary({
  revisions,
  children,
}: PublishedRevisionBoundaryProps) {
  const { registerPublishedRevision } = useEditMode();
  useEffect(() => {
    const unregister = PUBLISHABLE_ENTITY_TYPES.flatMap((entityType) => {
      const revision = revisions[entityType];
      return revision ? [registerPublishedRevision(entityType, revision)] : [];
    });
    return () => unregister.forEach((cleanup) => cleanup());
  }, [registerPublishedRevision, revisions]);
  return children;
}
