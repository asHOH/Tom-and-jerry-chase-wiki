import { convertToPinyin } from '../pinyinUtils';
import type { SearchMatch } from './types';

const FIELD_PRIORITY = { name: 40, alias: 30, description: 20, detail: 10 };

export type SearchField = readonly [
  text: string | undefined,
  kind: keyof typeof FIELD_PRIORITY,
  context?: string | undefined,
];

export function commonSearchFields(item: {
  name: string;
  aliases?: readonly string[] | undefined;
  description?: string | undefined;
  detailedDescription?: string | undefined;
}): SearchField[] {
  return [
    [item.name, 'name'],
    ...(item.aliases ?? []).map((alias): SearchField => [
      alias,
      'alias',
      `${item.name} (${alias})`,
    ]),
    [item.description, 'description'],
    [item.detailedDescription, 'detail'],
  ];
}

export function createSearchQuery(query: string) {
  const lowerCaseQuery = query.toLowerCase().trim();
  const pinyinQuery = lowerCaseQuery.replace(/'/g, '').replace(/ /g, '');

  // Names outrank aliases and prose across domains; equal matches retain field order.
  const matchFields = async (fields: readonly SearchField[]): Promise<SearchMatch | undefined> => {
    let bestMatch: SearchMatch | undefined;
    for (const [text, kind, context] of fields) {
      if (!text) continue;
      if (bestMatch && FIELD_PRIORITY[kind] + 3 <= bestMatch.priority) continue;
      const lowerCaseText = text.toLowerCase();
      const matchIndex = lowerCaseText.indexOf(lowerCaseQuery);
      const isDirectMatch = matchIndex !== -1;
      const matchedText = isDirectMatch ? lowerCaseText : await convertToPinyin(text);
      const matchedQuery = isDirectMatch ? lowerCaseQuery : pinyinQuery;
      if (!matchedQuery || !matchedText.includes(matchedQuery)) continue;
      const priority =
        FIELD_PRIORITY[kind] + (isDirectMatch ? 2 : 0) + (matchedText === matchedQuery ? 1 : 0);
      if (bestMatch && priority <= bestMatch.priority) continue;
      const source = context ?? text;
      const sourceMatchIndex = isDirectMatch
        ? context === undefined
          ? matchIndex
          : source.toLowerCase().indexOf(lowerCaseQuery)
        : -1;
      let startIndex = 0;
      // Explicit contexts retain their sentence; both paths begin after the last preceding comma.
      const separators = context === undefined ? '.!?,，' : ',，';
      for (let i = sourceMatchIndex - 1; i >= 0; i--) {
        if (separators.includes(source.charAt(i))) {
          startIndex = i + 1;
          break;
        }
      }
      const matchContext = source.substring(startIndex).trim();
      if (matchContext) {
        const highlightRanges: SearchMatch['highlightRanges'] = [];
        if (isDirectMatch) {
          const lowerCaseContext = matchContext.toLowerCase();
          let index = lowerCaseContext.indexOf(lowerCaseQuery);
          while (index !== -1) {
            highlightRanges.push([index, index + lowerCaseQuery.length]);
            index = lowerCaseContext.indexOf(lowerCaseQuery, index + lowerCaseQuery.length);
          }
        }
        bestMatch = {
          matchContext,
          highlightRanges,
          priority,
          isPinyinMatch: !isDirectMatch,
        };
      }
    }
    return bestMatch;
  };

  return { lowerCaseQuery, pinyinQuery, matchFields };
}

export type SearchQuery = ReturnType<typeof createSearchQuery>;
