// Character search logic extracted from searchUtils.ts

import { cards } from '@/data';
import { convertToPinyin } from '../pinyinUtils';

import type { SearchResult } from './types';

export async function* searchCards(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  // Search cards
  for (const card of Object.values(cards)) {
    let matchContext: string | undefined;
    let priority: number = 0;
    let isPinyinMatch: boolean = false;

    const cardIdLowerCase = card.id.toLowerCase();
    const cardIdPinyin = await convertToPinyin(card.id);

    // Check card ID (direct match)
    if (cardIdLowerCase.includes(lowerCaseQuery)) {
      matchContext = card.id;
      priority = 0.2;
      isPinyinMatch = false;
    }
    // Check card ID (pinyin match)
    else if (cardIdPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = card.id;
      priority = 0.19;
      isPinyinMatch = true;
    }
    // Check card description
    else if (card.description.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.description;
      priority = 0.18;
      isPinyinMatch = false;
    } else if (
      (await convertToPinyin(card.description)).includes(pinyinQuery) &&
      pinyinQuery.length > 0
    ) {
      matchContext = card.description;
      priority = 0.17;
      isPinyinMatch = true;
    }
    // Check detailed description
    else if (card.detailedDescription?.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.detailedDescription;
      priority = 0.16;
      isPinyinMatch = false;
    } else if (
      (await convertToPinyin(card.detailedDescription)).includes(pinyinQuery) &&
      pinyinQuery.length > 0
    ) {
      matchContext = card.detailedDescription;
      priority = 0.15;
      isPinyinMatch = true;
    }
    // Check levels description
    else if (card.levels) {
      for (const level of card.levels) {
        const levelDescriptionLowerCase = level.description.toLowerCase();
        const levelDescriptionPinyin = await convertToPinyin(level.description);

        if (levelDescriptionLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([level.description]);
          priority = 0.14;
          isPinyinMatch = false;
          break;
        } else if (levelDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([level.description]);
          priority = 0.13;
          isPinyinMatch = true;
          break;
        }
      }
    }
    // Check levels detailedDescription
    if (!matchContext && card.levels) {
      for (const level of card.levels) {
        const levelDetailedDescriptionLowerCase = level.detailedDescription?.toLowerCase();
        const levelDetailedDescriptionPinyin = await convertToPinyin(level.detailedDescription);

        if (levelDetailedDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([level.detailedDescription]);
          priority = 0.12;
          isPinyinMatch = false;
          break;
        } else if (levelDetailedDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([level.detailedDescription]);
          priority = 0.11;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'card',
        id: card.id,
        imageUrl: card.imageUrl!,
        matchContext: matchContext,
        priority: priority,
        isPinyinMatch: isPinyinMatch,
      };
    }
  }
}
