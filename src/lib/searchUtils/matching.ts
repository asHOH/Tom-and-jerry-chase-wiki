import { convertToPinyin } from '../pinyinUtils';

export type SearchField = readonly [
  text: string | undefined,
  directPriority: number,
  pinyinPriority: number,
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
    [item.name, 1, 0.95],
    ...(item.aliases ?? []).map((alias): SearchField => [
      alias,
      0.9,
      0.85,
      `${item.name} (${alias})`,
    ]),
    [item.description, 0.8, 0.75],
    [item.detailedDescription, 0.7, 0.65],
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

  // Field order defines precedence; scores only rank results after an item matches.
  const matchFields = async (fields: readonly SearchField[]): Promise<SearchMatch | undefined> => {
    for (const [text, directPriority, pinyinPriority, context] of fields) {
      if (!text) continue;
      const isDirectMatch = text.toLowerCase().includes(lowerCaseQuery);
      if (!isDirectMatch && !(pinyinQuery && (await convertToPinyin(text)).includes(pinyinQuery))) {
        continue;
      }
      const matchContext = context ?? (await findMatchContext([text]));
      if (matchContext) {
        return {
          matchContext,
          priority: isDirectMatch ? directPriority : pinyinPriority,
          isPinyinMatch: !isDirectMatch,
        };
      }
    }
    return undefined;
  };

  return { lowerCaseQuery, pinyinQuery, findMatchContext, matchFields };
}

export type SearchQuery = ReturnType<typeof createSearchQuery>;
