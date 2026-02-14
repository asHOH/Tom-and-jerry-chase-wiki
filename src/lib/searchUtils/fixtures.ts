import { fixtures } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchFixtures(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const fixture of Object.values(fixtures)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = fixture.name.toLowerCase();
    const namePinyin = await convertToPinyin(fixture.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([fixture.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([fixture.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && fixture.aliases) {
      for (const alias of fixture.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${fixture.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${fixture.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && fixture.description) {
      const descLowerCase = fixture.description.toLowerCase();
      const descPinyin = await convertToPinyin(fixture.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([fixture.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([fixture.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && fixture.detailedDescription) {
      const detailLowerCase = fixture.detailedDescription.toLowerCase();
      const detailPinyin = await convertToPinyin(fixture.detailedDescription);
      if (detailLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([fixture.detailedDescription]);
        priority = 0.7;
        isPinyinMatch = false;
      } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([fixture.detailedDescription]);
        priority = 0.65;
        isPinyinMatch = true;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'fixture',
        name: fixture.name,
        imageUrl: fixture.imageUrl,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
