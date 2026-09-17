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

// Search configuration constants
const MAX_RESULTS_PER_TYPE = 5;
const MAX_TOTAL_RESULTS = 20;

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

  // Limit results per type and sort by priority
  const limitedResults: SearchResult[] = [];

  for (const results of allSearchResults) {
    const sortedResults = results.sort((a, b) => b.priority - a.priority);
    const limitedTypeResults = sortedResults.slice(0, MAX_RESULTS_PER_TYPE);
    limitedResults.push(...limitedTypeResults);
  }

  // Sort all results by priority and apply total limit
  const finalResults = limitedResults
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_TOTAL_RESULTS);

  return finalResults;
}

export type { SearchResult };
