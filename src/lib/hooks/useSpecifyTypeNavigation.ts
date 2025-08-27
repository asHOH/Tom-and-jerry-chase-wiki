import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { items, entities } from '@/data';

//The Navigation for knowledgeCards,specialSkills,items,entities

type typelist = 'item' | 'entity';
export const useSpecifyTypeNavigation = (currentId: string, specifyType: typelist) => {
  const router = useRouter();

  // Get all IDs in the same order as displayed in entity grid
  // (For items and entities, Id refers to 'Name')

  const allIds: Record<typelist, string[]> = {
    item: Object.keys(items),
    entity: useMemo(() => {
      const catIds = Object.keys(entities['cat']);
      const mouseIds = Object.keys(entities['mouse']);
      return [...catIds, ...mouseIds];
    }, []),
  };
  const Ids = allIds[specifyType];

  // Get current index
  const currentIndex = useMemo(() => {
    return Ids.indexOf(currentId);
  }, [Ids, currentId]);

  // Get previous target
  const previousTarget = useMemo(() => {
    if (currentIndex <= 0) return null;
    const prevId = Ids[currentIndex - 1];
    if (!prevId) return null;
    return {
      id: prevId,
      target: prevId,
    };
  }, [Ids, currentIndex]);

  // Get next target
  const nextTarget = useMemo(() => {
    if (currentIndex >= Ids.length - 1) return null;
    const nextId = Ids[currentIndex + 1];
    if (!nextId) return null;
    return {
      id: nextId,
      target: nextId,
    };
  }, [Ids, currentIndex]);

  // Navigation functions
  const navigateToPrevious = useCallback(() => {
    if (previousTarget?.id) {
      router.push(`/entities/${encodeURIComponent(previousTarget.id)}`);
    }
  }, [previousTarget, router]);

  const navigateToNext = useCallback(() => {
    if (nextTarget?.id) {
      router.push(`/entities/${encodeURIComponent(nextTarget.id)}`);
    }
  }, [nextTarget, router]);

  return {
    previousTarget,
    nextTarget,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totals: Ids.length,
  };
};
