import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { sortCardsByRank } from '@/lib/sortingUtils';
import type { FactionId } from '@/data/types';
import {
  achievements,
  buffs,
  cards,
  entities,
  fixtures,
  items,
  maps,
  modes,
  specialSkills,
} from '@/data';

export type NavigationEntityType =
  | 'knowledgeCard'
  | 'specialSkill'
  | 'item'
  | 'entity'
  | 'buff'
  | 'map'
  | 'fixture'
  | 'mode'
  | 'achievement';

/**
 * Navigation for knowledgeCards,specialSkills,items,entities
 * @param currentId - string - name of target to be searched
 * @param specifyType - 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' | 'buff' -type of target to be searched
 * @param factionId - Identifies the current special skill or achievement within its faction.
 */
export const useSpecifyTypeNavigation = (
  currentId: string,
  specifyType: NavigationEntityType,
  factionId?: FactionId
) => {
  const router = useRouter();

  // Keep the requested catalog in the same order as its entity grid.
  const Ids = useMemo(() => {
    switch (specifyType) {
      case 'knowledgeCard':
        return sortCardsByRank(Object.values(cards)).map((card) => card.id);
      case 'specialSkill':
        return [...Object.keys(specialSkills.cat), ...Object.keys(specialSkills.mouse)];
      case 'item':
        return Object.keys(items);
      case 'entity':
        return Object.keys(entities);
      case 'buff':
        return Object.keys(buffs);
      case 'map':
        return Object.keys(maps);
      case 'fixture':
        return Object.keys(fixtures);
      case 'mode':
        return Object.keys(modes);
      case 'achievement':
        return [...Object.keys(achievements.cat), ...Object.keys(achievements.mouse)];
    }
  }, [specifyType]);

  // Get current index
  const currentIndex = useMemo(() => {
    if (specifyType !== 'specialSkill' && specifyType !== 'achievement') {
      return Ids.indexOf(currentId);
    }
    if (!factionId) return -1;
    const catalog = specifyType === 'specialSkill' ? specialSkills : achievements;
    const index = Object.keys(catalog[factionId]).indexOf(currentId);
    if (index < 0) return -1;
    return index + (factionId === 'mouse' ? Object.keys(catalog.cat).length : 0);
  }, [Ids, currentId, specifyType, factionId]);

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
    if (currentIndex < 0 || currentIndex >= Ids.length - 1) return null;
    const nextId = Ids[currentIndex + 1];
    if (!nextId) return null;
    return {
      id: nextId,
      target: nextId,
    };
  }, [Ids, currentIndex]);

  // specifyType's url
  const specifyTypeUrl = useMemo(() => {
    return {
      knowledgeCard: 'cards',
      specialSkill: 'special-skills',
      item: 'items',
      entity: 'entities',
      buff: 'buffs',
      map: 'maps',
      fixture: 'fixtures',
      mode: 'modes',
      achievement: 'achievements',
    };
  }, []);

  const factionUrl = useMemo(() => {
    if (specifyType !== 'specialSkill' && specifyType !== 'achievement') return ['', ''];
    const catLength =
      specifyType === 'specialSkill'
        ? Object.keys(specialSkills.cat).length
        : Object.keys(achievements.cat).length;
    const getPrefix = (index: number) => (index < catLength ? 'cat/' : 'mouse/');
    return [getPrefix(currentIndex - 1), getPrefix(currentIndex + 1)];
  }, [currentIndex, specifyType]);

  // Navigation functions
  const navigateToPrevious = useCallback(() => {
    if (previousTarget?.id) {
      router.push(
        `/${specifyTypeUrl[specifyType]}/${factionUrl[0]}${encodeURIComponent(previousTarget.id)}`
      );
    }
  }, [previousTarget, router, specifyType, specifyTypeUrl, factionUrl]);

  const navigateToNext = useCallback(() => {
    if (nextTarget?.id) {
      router.push(
        `/${specifyTypeUrl[specifyType]}/${factionUrl[1]}${encodeURIComponent(nextTarget.id)}`
      );
    }
  }, [nextTarget, router, specifyType, specifyTypeUrl, factionUrl]);

  return {
    previousTarget,
    nextTarget,
    navigateToPrevious,
    navigateToNext,
    currentIndex,
    totals: Ids.length,
  };
};
