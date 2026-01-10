// Achievement search logic

import { achievements } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchAchievements(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const achievement of Object.values(achievements)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = achievement.name.toLowerCase();
    const namePinyin = await convertToPinyin(achievement.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([achievement.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([achievement.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && achievement.aliases) {
      for (const alias of achievement.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${achievement.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${achievement.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && achievement.description) {
      const descLowerCase = achievement.description.toLowerCase();
      const descPinyin = await convertToPinyin(achievement.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([achievement.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([achievement.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && achievement.detailedDescription) {
      const detailLowerCase = achievement.detailedDescription.toLowerCase();
      const detailPinyin = await convertToPinyin(achievement.detailedDescription);
      if (detailLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([achievement.detailedDescription]);
        priority = 0.7;
        isPinyinMatch = false;
      } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([achievement.detailedDescription]);
        priority = 0.65;
        isPinyinMatch = true;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'achievement',
        name: achievement.name,
        imageUrl: achievement.imageUrl,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
