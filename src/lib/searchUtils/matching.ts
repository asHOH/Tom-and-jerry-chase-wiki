import { convertToPinyin } from '../pinyinUtils';

const FIELD_PRIORITY = { name: 40, alias: 30, description: 20, detail: 10 };

export type SearchField = readonly [
  text: string | undefined,
  kind: keyof typeof FIELD_PRIORITY,
  context?: string | undefined,
];

export type SearchMatch = {
  matchContext: string;
  priority: number;
  isPinyinMatch: boolean;
};

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

  const findMatchContext = async (texts: (string | undefined)[]): Promise<string | undefined> => {
    for (const text of texts) {
      if (!text) continue;
      const matchIndex = text.toLowerCase().indexOf(lowerCaseQuery);
      if (matchIndex !== -1) {
        let startIndex = 0;
        for (let i = matchIndex - 1; i >= 0; i--) {
          if (['.', '!', '?'].includes(text.charAt(i))) {
            startIndex = i + 1;
            break;
          }
        }
        for (let i = startIndex; i < matchIndex; i++) {
          if (text[i] === ',' || text[i] === '，') {
            startIndex = i + 1;
            break;
          }
        }
        return text.substring(startIndex).trim();
      }
      if (pinyinQuery && (await convertToPinyin(text)).includes(pinyinQuery)) return text.trim();
    }
    return undefined;
  };

  // Names outrank aliases and prose across domains; equal matches retain field order.
  const matchFields = async (fields: readonly SearchField[]): Promise<SearchMatch | undefined> => {
    let bestMatch: SearchMatch | undefined;
    for (const [text, kind, context] of fields) {
      if (!text) continue;
      if (bestMatch && FIELD_PRIORITY[kind] + 3 <= bestMatch.priority) continue;
      const lowerCaseText = text.toLowerCase();
      const isDirectMatch = lowerCaseText.includes(lowerCaseQuery);
      const matchedText = isDirectMatch ? lowerCaseText : await convertToPinyin(text);
      const matchedQuery = isDirectMatch ? lowerCaseQuery : pinyinQuery;
      if (!matchedQuery || !matchedText.includes(matchedQuery)) continue;
      const priority =
        FIELD_PRIORITY[kind] + (isDirectMatch ? 2 : 0) + (matchedText === matchedQuery ? 1 : 0);
      if (bestMatch && priority <= bestMatch.priority) continue;
      const matchContext = context ?? (await findMatchContext([text]));
      if (matchContext) {
        bestMatch = {
          matchContext,
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
