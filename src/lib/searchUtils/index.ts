import type { PublishedGameDataByType } from '@/lib/gameData/published/types';

import { searchAchievements } from './achievements';
import { searchBuffs, searchDetailedBuffs } from './buffs';
import { searchCards } from './cards';
import { searchCharacters } from './character';
import { searchDocs } from './docs';
import { searchEntities } from './entities';
import { searchFixtures } from './fixtures';
import { searchItemGroups } from './itemGroups';
import { searchItems } from './items';
import { searchMaps } from './maps';
import { createSearchQuery } from './matching';
import { searchModes } from './modes';
import { searchSpecialSkills } from './specialSkills';
import { SearchResult } from './types';

export async function performSearch(
  query: string,
  gameData: PublishedGameDataByType
): Promise<SearchResult[]> {
  const searchQuery = createSearchQuery(query);
  if (!searchQuery.lowerCaseQuery) return [];

  const allSearchResults = await Promise.all([
    searchCharacters(searchQuery, gameData.characters),
    searchCards(searchQuery, gameData.cards),
    searchSpecialSkills(searchQuery, gameData.specialSkills),
    searchItemGroups(searchQuery),
    searchItems(searchQuery, gameData.items),
    searchEntities(searchQuery, gameData.entities),
    searchBuffs(searchQuery, gameData.buffs),
    searchMaps(searchQuery, gameData.maps),
    searchFixtures(searchQuery, gameData.fixtures),
    searchModes(searchQuery, gameData.modes),
    searchAchievements(searchQuery, gameData.achievements),
    searchDocs(searchQuery),
    searchDetailedBuffs(searchQuery),
  ]);

  return allSearchResults.flat().sort((a, b) => b.priority - a.priority);
}

export type { SearchResult };
