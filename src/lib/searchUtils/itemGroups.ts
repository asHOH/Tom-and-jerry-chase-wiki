import { getItemGroupImageUrl } from '@/features/items/components/itemGroups/itemGroup-grid/getItemGroupImageUrl';
import { itemGroups } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchItemGroups(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const group of Object.values(itemGroups)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = group.name.toLowerCase();
    const namePinyin = await convertToPinyin(group.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([group.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([group.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && group.aliases) {
      for (const alias of group.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${group.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${group.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && group.description) {
      const descLowerCase = group.description.toLowerCase();
      const descPinyin = await convertToPinyin(group.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([group.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([group.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'itemGroup',
        name: group.name,
        imageUrl: getItemGroupImageUrl(group),
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
