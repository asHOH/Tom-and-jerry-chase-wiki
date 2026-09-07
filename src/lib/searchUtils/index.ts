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

export async function performSearch(query: string): Promise<SearchResult[]> {
  const searchQuery = createSearchQuery(query);
  if (!searchQuery.lowerCaseQuery) return [];

  const allSearchResults = await Promise.all([
    searchCharacters(searchQuery),
    searchCards(searchQuery),
    searchSpecialSkills(searchQuery),
    searchItemGroups(searchQuery),
    searchItems(searchQuery),
    searchEntities(searchQuery),
    searchBuffs(searchQuery),
    searchMaps(searchQuery),
    searchFixtures(searchQuery),
    searchModes(searchQuery),
    searchAchievements(searchQuery),
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
