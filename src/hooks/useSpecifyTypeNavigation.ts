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

  const filteredAndSortedCards = sortCardsByRank(
    Object.values(cards).filter((card) => card.cost >= 2 && card.cost <= 7)
  );

  // Get all Ids in the same order as displayed in entity grid
  const allIds: Record<NavigationEntityType, string[]> = {
    knowledgeCard: useMemo(() => {
      const cardlist: string[] = filteredAndSortedCards.map((card) => {
        return card.id;
      });
      return cardlist;
    }, [filteredAndSortedCards]),
    specialSkill: useMemo(() => {
      const catIds = Object.keys(specialSkills['cat']);
      const mouseIds = Object.keys(specialSkills['mouse']);
      return [...catIds, ...mouseIds];
    }, []),
    item: useMemo(() => {
      return Object.keys(items);
    }, []),
    entity: useMemo(() => {
      return Object.keys(entities);
    }, []),
    buff: useMemo(() => {
      return Object.keys(buffs);
    }, []),
    map: useMemo(() => {
      return Object.keys(maps);
    }, []),
    fixture: useMemo(() => {
      return Object.keys(fixtures);
    }, []),
    mode: useMemo(() => {
      return Object.keys(modes);
    }, []),
    achievement: useMemo(() => {
      return [...Object.keys(achievements.cat), ...Object.keys(achievements.mouse)];
    }, []),
  };

  //Get specifyType's Ids
  const Ids = allIds[specifyType];

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
