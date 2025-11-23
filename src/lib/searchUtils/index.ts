import { convertToPinyin } from '../pinyinUtils';
import { searchCards } from './cards';
import { searchCharacters } from './character';
import { searchItems } from './items';
import { searchSpecialSkills } from './specialSkills';
import { SearchResult } from './types';

// Search configuration constants
const MAX_RESULTS_PER_TYPE = 5;
const MAX_TOTAL_RESULTS = 20;

export const performSearch = async function* (query: string): AsyncGenerator<SearchResult> {
  const lowerCaseQuery = query.toLowerCase().trim(); // Trim whitespace
  // Remove apostrophes from the query before converting to pinyin, as they are not part of pinyin for search
  const cleanedQuery = lowerCaseQuery.replace(/'/g, '').replace(/ /g, '');
  // const pinyinQuery = convertToPinyin(cleanedQuery); // Convert query to pinyin
  const pinyinQuery = cleanedQuery;

  if (!lowerCaseQuery) {
    // If query is empty or only whitespace, yield no results
    return;
  }

  const findMatchContext = async (texts: (string | undefined)[]): Promise<string | undefined> => {
    for (const text of texts) {
      if (text) {
        const lowerCaseText = text.toLowerCase();
        const pinyinText = await convertToPinyin(text);

        // Check for direct match
        if (lowerCaseText.includes(lowerCaseQuery)) {
          let startIndex = 0;
          const matchIndex = lowerCaseText.indexOf(lowerCaseQuery);

          // 1. Find sentence start (., !, ?) before the match
          for (let i = matchIndex - 1; i >= 0; i--) {
            const char = text.charAt(i);
            if (['.', '!', '?'].includes(char)) {
              startIndex = i + 1;
              break;
            }
          }

          // 2. Find first comma after sentence start and before the match
          for (let i = startIndex; i < matchIndex; i++) {
            const char = text.charAt(i);
            if (char === ',' || char === '，') {
              startIndex = i + 1;
              break;
            }
          }
          return text.substring(startIndex).trim();
        }

        // Check for pinyin match
        if (pinyinText.includes(pinyinQuery) && pinyinQuery.length > 0) {
          // For pinyin matches, return the full text for context,
          // as highlighting pinyin within Chinese text is complex.
          return text.trim();
        }
      }
    }
    return undefined;
  };

  // Polyfill for Array.fromAsync for compatibility with older browsers
  async function arrayFromAsync<T>(iterable: AsyncIterable<T>): Promise<T[]> {
    const arr: T[] = [];
    for await (const item of iterable) {
      arr.push(item);
    }
    return arr;
  }

  const allSearchResults = await Promise.all([
    arrayFromAsync(searchCharacters(findMatchContext, lowerCaseQuery, pinyinQuery)),
    arrayFromAsync(searchCards(findMatchContext, lowerCaseQuery, pinyinQuery)),
    arrayFromAsync(searchSpecialSkills(findMatchContext, lowerCaseQuery, pinyinQuery)),
    arrayFromAsync(searchItems(findMatchContext, lowerCaseQuery, pinyinQuery)),
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

  for (const result of finalResults) {
    yield result;
  }
};

export type { SearchResult };
