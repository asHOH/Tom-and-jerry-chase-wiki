import { maps } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchMaps(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const map of Object.values(maps)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = map.name.toLowerCase();
    const namePinyin = await convertToPinyin(map.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([map.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([map.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && map.aliases) {
      for (const alias of map.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${map.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${map.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && map.description) {
      const descLowerCase = map.description.toLowerCase();
      const descPinyin = await convertToPinyin(map.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([map.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([map.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && map.detailedDescription) {
      const detailLowerCase = map.detailedDescription.toLowerCase();
      const detailPinyin = await convertToPinyin(map.detailedDescription);
      if (detailLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([map.detailedDescription]);
        priority = 0.7;
        isPinyinMatch = false;
      } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([map.detailedDescription]);
        priority = 0.65;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && map.mapSkin) {
      for (const skin of map.mapSkin) {
        const skinNameLowerCase = skin.name.toLowerCase();
        const skinNamePinyin = await convertToPinyin(skin.name);
        if (skinNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${map.name} (${skin.name})`;
          priority = 0.6;
          isPinyinMatch = false;
          break;
        } else if (skinNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${map.name} (${skin.name})`;
          priority = 0.55;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && map.mapSkin) {
      for (const skin of map.mapSkin) {
        const skinDescLowerCase = skin.description.toLowerCase();
        const skinDescPinyin = await convertToPinyin(skin.description);
        if (skinDescLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([skin.description]);
          priority = 0.5;
          isPinyinMatch = false;
          break;
        } else if (skinDescPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([skin.description]);
          priority = 0.45;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'map',
        name: map.name,
        imageUrl: map.imageUrl,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
