import { buffs } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchBuffs(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const buff of Object.values(buffs)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = buff.name.toLowerCase();
    const namePinyin = await convertToPinyin(buff.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([buff.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([buff.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && buff.aliases) {
      for (const alias of buff.aliases) {
        const isRegex = alias.startsWith('#') || alias.startsWith('%');
        if (isRegex) continue;
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${buff.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${buff.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && buff.description) {
      const descLowerCase = buff.description.toLowerCase();
      const descPinyin = await convertToPinyin(buff.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([buff.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([buff.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && buff.detailedDescription) {
      const detailLowerCase = buff.detailedDescription.toLowerCase();
      const detailPinyin = await convertToPinyin(buff.detailedDescription);
      if (detailLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([buff.detailedDescription]);
        priority = 0.7;
        isPinyinMatch = false;
      } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([buff.detailedDescription]);
        priority = 0.65;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && buff.stack) {
      const stackLowerCase = buff.stack.toLowerCase();
      const stackPinyin = await convertToPinyin(buff.stack);
      if (stackLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([buff.stack]);
        priority = 0.6;
        isPinyinMatch = false;
      } else if (stackPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([buff.stack]);
        priority = 0.55;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && buff.detailedStack) {
      const detailStackLowerCase = buff.detailedStack.toLowerCase();
      const detailStackPinyin = await convertToPinyin(buff.detailedStack);
      if (detailStackLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([buff.detailedStack]);
        priority = 0.5;
        isPinyinMatch = false;
      } else if (detailStackPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([buff.detailedStack]);
        priority = 0.45;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && buff.sourceDescription) {
      const sourceLowerCase = buff.sourceDescription.toLowerCase();
      const sourcePinyin = await convertToPinyin(buff.sourceDescription);
      if (sourceLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([buff.sourceDescription]);
        priority = 0.4;
        isPinyinMatch = false;
      } else if (sourcePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([buff.sourceDescription]);
        priority = 0.35;
        isPinyinMatch = true;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'buff',
        name: buff.name,
        imageUrl: buff.imageUrl,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
