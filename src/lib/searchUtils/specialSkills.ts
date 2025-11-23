// Special skill search logic

import { specialSkills } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchSpecialSkills(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const factionId of ['cat', 'mouse'] as const) {
    for (const skill of Object.values(
      specialSkills[factionId]
    ) as import('@/data/types').SpecialSkill[]) {
      let matchContext: string | undefined;
      let priority = 0;
      let isPinyinMatch = false;

      const nameLowerCase = skill.name.toLowerCase();
      const namePinyin = await convertToPinyin(skill.name);

      if (nameLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([skill.name]);
        priority = 1.0;
        isPinyinMatch = false;
      } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([skill.name]);
        priority = 0.95;
        isPinyinMatch = true;
      }

      if (!matchContext && skill.aliases) {
        for (const alias of skill.aliases) {
          const aliasLowerCase = alias.toLowerCase();
          const aliasPinyin = await convertToPinyin(alias);
          if (aliasLowerCase.includes(lowerCaseQuery)) {
            matchContext = `${skill.name} (${alias})`;
            priority = 0.9;
            isPinyinMatch = false;
            break;
          } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
            matchContext = `${skill.name} (${alias})`;
            priority = 0.85;
            isPinyinMatch = true;
            break;
          }
        }
      }

      if (!matchContext && skill.description) {
        const descLowerCase = skill.description.toLowerCase();
        const descPinyin = await convertToPinyin(skill.description);
        if (descLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([skill.description]);
          priority = 0.8;
          isPinyinMatch = false;
        } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([skill.description]);
          priority = 0.75;
          isPinyinMatch = true;
        }
      }

      if (!matchContext && skill.detailedDescription) {
        const detailLowerCase = skill.detailedDescription.toLowerCase();
        const detailPinyin = await convertToPinyin(skill.detailedDescription);
        if (detailLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([skill.detailedDescription]);
          priority = 0.7;
          isPinyinMatch = false;
        } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([skill.detailedDescription]);
          priority = 0.65;
          isPinyinMatch = true;
        }
      }

      if (matchContext) {
        await new Promise((resolve) => setTimeout(resolve, 10));
        yield {
          type: 'specialSkill',
          name: skill.name,
          imageUrl: skill.imageUrl,
          factionId: skill.factionId,
          matchContext,
          priority,
          isPinyinMatch,
        };
      }
    }
  }
}
