import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { entities } from '@/data';

export const useEntityNavigation = (currentEntityId: string) => {
  const router = useRouter();

  // Get all entity IDs in the same order as displayed in entity grid
  // (For entities, Id refers to 'entityName')
  // (mice first in their original order, then cats in their original order)
  const entityIds = useMemo(() => {
    const mouseIds = Object.keys(entities['cat']);
    const catIds = Object.keys(entities['mouse']);
    return [...mouseIds, ...catIds];
  }, []);

  // Get current entity index
  const currentIndex = useMemo(() => {
    return entityIds.indexOf(currentEntityId);
  }, [entityIds, currentEntityId]);

  // Get previous entity
  const previousEntity = useMemo(() => {
    if (currentIndex <= 0) return null;
    const prevId = entityIds[currentIndex - 1];
    if (!prevId) return null;
    return {
      id: prevId,
      entity: prevId,
    };
  }, [entityIds, currentIndex]);

  // Get next entity
  const nextEntity = useMemo(() => {
    if (currentIndex >= entityIds.length - 1) return null;
    const nextId = entityIds[currentIndex + 1];
    if (!nextId) return null;
    return {
      id: nextId,
      entity: nextId,
    };
  }, [entityIds, currentIndex]);

  // Navigation functions
  const navigateToPrevious = useCallback(() => {
    if (previousEntity?.id) {
      router.push(`/entities/${encodeURIComponent(previousEntity.id)}`);
    }
  }, [previousEntity, router]);

  const navigateToNext = useCallback(() => {
    if (nextEntity?.id) {
      router.push(`/entities/${encodeURIComponent(nextEntity.id)}`);
    }
  }, [nextEntity, router]);

  return {
    previousEntity,
    nextEntity,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totalEntities: entityIds.length,
  };
};
