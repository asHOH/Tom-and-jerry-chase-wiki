import { modes } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchModes(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const mode of Object.values(modes)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = mode.name.toLowerCase();
    const namePinyin = await convertToPinyin(mode.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([mode.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([mode.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && mode.aliases) {
      for (const alias of mode.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${mode.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${mode.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && mode.description) {
      const descLowerCase = mode.description.toLowerCase();
      const descPinyin = await convertToPinyin(mode.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([mode.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([mode.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && mode.detailedDescription) {
      const detailLowerCase = mode.detailedDescription.toLowerCase();
      const detailPinyin = await convertToPinyin(mode.detailedDescription);
      if (detailLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([mode.detailedDescription]);
        priority = 0.7;
        isPinyinMatch = false;
      } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([mode.detailedDescription]);
        priority = 0.65;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && mode.rules) {
      const rulesLowerCase = mode.rules.toLowerCase();
      const rulesPinyin = await convertToPinyin(mode.rules);
      if (rulesLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([mode.rules]);
        priority = 0.6;
        isPinyinMatch = false;
      } else if (rulesPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([mode.rules]);
        priority = 0.55;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && mode.detailedRules) {
      const detailRulesLowerCase = mode.detailedRules.toLowerCase();
      const detailRulesPinyin = await convertToPinyin(mode.detailedRules);
      if (detailRulesLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([mode.detailedRules]);
        priority = 0.5;
        isPinyinMatch = false;
      } else if (detailRulesPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([mode.detailedRules]);
        priority = 0.45;
        isPinyinMatch = true;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'mode',
        name: mode.name,
        imageUrl: mode.imageUrl,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
