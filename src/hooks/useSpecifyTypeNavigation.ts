import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { createRankFilter, useFilterState } from '@/lib/filterUtils';
import { sortCardsByRank } from '@/lib/sortingUtils';
import type { FactionId } from '@/data/types';
import { buffs, cards, entities, items, maps, specialSkills } from '@/data';

type typelist = 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' | 'buff' | 'map';

/**
 * Navigation for knowledgeCards,specialSkills,items,entities
 * @param currentId - string - name of target to be searched
 * @param specifyType - 'knowledgeCard' | 'specialSkill' | 'item' | 'entity' | 'buff' -type of target to be searched
 * @param under - boolean(default false) - revease search to avoid same name(such as 应急治疗)
 */
export const useSpecifyTypeNavigation = (
  currentId: string,
  specifyType: typelist,
  under: boolean
) => {
  const router = useRouter();

  const { selectedFilters: selectedRanks } = useFilterState<string>();
  const [costRange] = useState<[number, number]>([2, 7]);
  const [selectedFaction] = useState<FactionId | null>(null);

  const filteredAndSortedCards = sortCardsByRank(
    Object.values(cards)
      .filter(createRankFilter(selectedRanks))
      .filter((card) => card.cost >= costRange[0] && card.cost <= costRange[1])
      .filter((card) => !selectedFaction || card.factionId === selectedFaction)
  );

  // Get all Ids in the same order as displayed in entity grid
  const allIds: Record<typelist, string[]> = {
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
      const catIds = Object.keys(entities['cat']);
      const mouseIds = Object.keys(entities['mouse']);
      return [...catIds, ...mouseIds];
    }, []),
    buff: useMemo(() => {
      return Object.keys(buffs);
    }, []),
    map: useMemo(() => {
      return Object.keys(maps);
    }, []),
  };

  //Get specifyType's Ids
  const Ids = allIds[specifyType];

  // Get current index
  const currentIndex = useMemo(() => {
    if (under) {
      const Return = Ids.length - Ids.reverse().indexOf(currentId) - 1;
      Ids.reverse();
      return Return;
    }
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
    return {
      knowledgeCard: 'cards',
      specialSkill: 'special-skills',
      item: 'items',
      entity: 'entities',
      buff: 'buffs',
      map: 'maps',
    };
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
