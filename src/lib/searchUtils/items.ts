// Item search logic

import { items } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchItems(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const item of Object.values(items)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = item.name.toLowerCase();
    const namePinyin = await convertToPinyin(item.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([item.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([item.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && item.aliases) {
      for (const alias of item.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${item.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${item.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && item.description) {
      const descLowerCase = item.description.toLowerCase();
      const descPinyin = await convertToPinyin(item.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([item.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([item.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && item.detailedDescription) {
      const detailLowerCase = item.detailedDescription.toLowerCase();
      const detailPinyin = await convertToPinyin(item.detailedDescription);
      if (detailLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([item.detailedDescription]);
        priority = 0.7;
        isPinyinMatch = false;
      } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([item.detailedDescription]);
        priority = 0.65;
        isPinyinMatch = true;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'item',
        name: item.name,
        imageUrl: item.imageUrl,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
