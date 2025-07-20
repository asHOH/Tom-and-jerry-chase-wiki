import { convertToPinyin } from '../pinyinUtils';
import { searchCards } from './cards';
import { searchCharacters } from './character';
import { searchSpecialSkills } from './specialSkills';
import { searchItems } from './items';
import { SearchResult } from './types';

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

  const allSearchResults = await Promise.all([
    Array.fromAsync(searchCharacters(findMatchContext, lowerCaseQuery, pinyinQuery)),
    Array.fromAsync(searchCards(findMatchContext, lowerCaseQuery, pinyinQuery)),
    Array.fromAsync(searchSpecialSkills(findMatchContext, lowerCaseQuery, pinyinQuery)),
    Array.fromAsync(searchItems(findMatchContext, lowerCaseQuery, pinyinQuery)),
  ]);

  for (const results of allSearchResults) {
    for (const result of results) {
      yield result;
    }
  }
};

export type { SearchResult };
