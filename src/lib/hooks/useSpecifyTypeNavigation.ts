import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { specialSkills, items, entities } from '@/data';

//The Navigation for knowledgeCards,specialSkills,items,entities
// "under" is used for avoid same name(specialSkills)

type typelist = 'specialSkill' | 'item' | 'entity';
export const useSpecifyTypeNavigation = (
  currentId: string,
  specifyType: typelist,
  under: boolean
) => {
  const router = useRouter();

  // Get all IDs in the same order as displayed in entity grid
  // (For items and entities, Id refers to 'Name')

  const allIds: Record<typelist, string[]> = {
    specialSkill: useMemo(() => {
      const catIds = Object.keys(specialSkills['cat']);
      const mouseIds = Object.keys(specialSkills['mouse']);
      return [...catIds, ...mouseIds];
    }, []),
    item: useMemo(() => {
      return Object.keys(items);
    }, []),
    entity: useMemo(() => {
      const catIds = Object.keys(entities['cat']);
      const mouseIds = Object.keys(entities['mouse']);
      return [...catIds, ...mouseIds];
    }, []),
  };
  const Ids = allIds[specifyType];

  // Get current index
  const currentIndex = useMemo(() => {
    if (under) return Ids.length - Ids.reverse().indexOf(currentId) - 1;
    return Ids.indexOf(currentId);
  }, [Ids, currentId, under]);

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

  // specifyType's url
  const specifyTypeUrl = useMemo(() => {
    return { specialSkill: 'special-skills', item: 'items', entity: 'entities' };
  }, []);

  //adopt specialSkill's url
  const specialUrl = useMemo(() => {
    if (specifyType != 'specialSkill') return ['', ''];
    const length = Object.keys(specialSkills['cat']).length;
    if (currentIndex < length - 1) return ['cat/', 'cat/'];
    if (currentIndex == length - 1 || currentIndex == length) return ['cat/', 'mouse/'];
    if (currentIndex > length - 1) return ['mouse/', 'mouse/'];
    return ['', ''];
  }, [currentIndex, specifyType]);

  // Navigation functions
  const navigateToPrevious = useCallback(() => {
    if (previousTarget?.id) {
      router.push(
        `/${specifyTypeUrl[specifyType]}/${specialUrl[0]}${encodeURIComponent(previousTarget.id)}`
      );
    }
  }, [previousTarget, router, specifyType, specifyTypeUrl, specialUrl]);

  const navigateToNext = useCallback(() => {
    if (nextTarget?.id) {
      router.push(
        `/${specifyTypeUrl[specifyType]}/${specialUrl[1]}${encodeURIComponent(nextTarget.id)}`
      );
    }
  }, [nextTarget, router, specifyType, specifyTypeUrl, specialUrl]);

  return {
    previousTarget,
    nextTarget,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totals: Ids.length,
  };
};
