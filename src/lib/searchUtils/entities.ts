import { entities } from '@/data';

import { convertToPinyin } from '../pinyinUtils';
import type { SearchResult } from './types';

export async function* searchEntities(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const entity of Object.values(entities)) {
    let matchContext: string | undefined;
    let priority = 0;
    let isPinyinMatch = false;

    const nameLowerCase = entity.name.toLowerCase();
    const namePinyin = await convertToPinyin(entity.name);

    if (nameLowerCase.includes(lowerCaseQuery)) {
      matchContext = await findMatchContext([entity.name]);
      priority = 1.0;
      isPinyinMatch = false;
    } else if (namePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = await findMatchContext([entity.name]);
      priority = 0.95;
      isPinyinMatch = true;
    }

    if (!matchContext && entity.aliases) {
      for (const alias of entity.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);
        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${entity.name} (${alias})`;
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${entity.name} (${alias})`;
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && entity.description) {
      const descLowerCase = entity.description.toLowerCase();
      const descPinyin = await convertToPinyin(entity.description);
      if (descLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([entity.description]);
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([entity.description]);
        priority = 0.75;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && entity.detailedDescription) {
      const detailLowerCase = entity.detailedDescription.toLowerCase();
      const detailPinyin = await convertToPinyin(entity.detailedDescription);
      if (detailLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([entity.detailedDescription]);
        priority = 0.7;
        isPinyinMatch = false;
      } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([entity.detailedDescription]);
        priority = 0.65;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && entity.create) {
      const createLowerCase = entity.create.toLowerCase();
      const createPinyin = await convertToPinyin(entity.create);
      if (createLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([entity.create]);
        priority = 0.6;
        isPinyinMatch = false;
      } else if (createPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([entity.create]);
        priority = 0.55;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && entity.detailedCreate) {
      const detailCreateLowerCase = entity.detailedCreate.toLowerCase();
      const detailCreatePinyin = await convertToPinyin(entity.detailedCreate);
      if (detailCreateLowerCase.includes(lowerCaseQuery)) {
        matchContext = await findMatchContext([entity.detailedCreate]);
        priority = 0.5;
        isPinyinMatch = false;
      } else if (detailCreatePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = await findMatchContext([entity.detailedCreate]);
        priority = 0.45;
        isPinyinMatch = true;
      }
    }

    if (!matchContext && entity.skills) {
      for (const skill of entity.skills) {
        const skillNameLowerCase = skill.name.toLowerCase();
        const skillNamePinyin = await convertToPinyin(skill.name);
        if (skillNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([skill.name]);
          priority = 0.4;
          isPinyinMatch = false;
          break;
        } else if (skillNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([skill.name]);
          priority = 0.35;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (!matchContext && entity.skills) {
      for (const skill of entity.skills) {
        if (skill.aliases) {
          for (const alias of skill.aliases) {
            const aliasLowerCase = alias.toLowerCase();
            const aliasPinyin = await convertToPinyin(alias);
            if (aliasLowerCase.includes(lowerCaseQuery)) {
              matchContext = `${skill.name} (${alias})`;
              priority = 0.34;
              isPinyinMatch = false;
              break;
            } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
              matchContext = `${skill.name} (${alias})`;
              priority = 0.33;
              isPinyinMatch = true;
              break;
            }
          }
        }
        if (matchContext) break;
      }
    }

    if (!matchContext && entity.skills) {
      for (const skill of entity.skills) {
        if (skill.description) {
          const descLowerCase = skill.description.toLowerCase();
          const descPinyin = await convertToPinyin(skill.description);
          if (descLowerCase.includes(lowerCaseQuery)) {
            matchContext = await findMatchContext([skill.description]);
            priority = 0.3;
            isPinyinMatch = false;
            break;
          } else if (descPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
            matchContext = await findMatchContext([skill.description]);
            priority = 0.25;
            isPinyinMatch = true;
            break;
          }
        }
        if (matchContext) break;
      }
    }

    if (!matchContext && entity.skills) {
      for (const skill of entity.skills) {
        if (skill.detailedDescription) {
          const detailLowerCase = skill.detailedDescription.toLowerCase();
          const detailPinyin = await convertToPinyin(skill.detailedDescription);
          if (detailLowerCase.includes(lowerCaseQuery)) {
            matchContext = await findMatchContext([skill.detailedDescription]);
            priority = 0.2;
            isPinyinMatch = false;
            break;
          } else if (detailPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
            matchContext = await findMatchContext([skill.detailedDescription]);
            priority = 0.18;
            isPinyinMatch = true;
            break;
          }
        }
        if (matchContext) break;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'entity',
        name: entity.name,
        imageUrl: entity.imageUrl,
        matchContext,
        priority,
        isPinyinMatch,
      };
    }
  }
}
