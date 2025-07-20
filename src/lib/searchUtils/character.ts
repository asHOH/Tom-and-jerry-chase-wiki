// Character search logic extracted from searchUtils.ts

import { characters } from '@/data';
import { convertToPinyin } from '../pinyinUtils';

import type { SearchResult } from './types';

export async function* searchCharacters(
  findMatchContext: (texts: (string | undefined)[]) => Promise<string | undefined>,
  lowerCaseQuery: string,
  pinyinQuery: string
): AsyncGenerator<SearchResult> {
  for (const character of Object.values(characters)) {
    let matchContext: string | undefined;
    let priority: number = 0;
    let isPinyinMatch: boolean = false;

    const characterIdLowerCase = character.id.toLowerCase();
    const characterIdPinyin = await convertToPinyin(character.id);

    if (characterIdLowerCase.includes(lowerCaseQuery)) {
      matchContext = character.id;
      priority = 1.0;
      isPinyinMatch = false;
    } else if (characterIdPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = character.id;
      priority = 0.95;
      isPinyinMatch = true;
    }
    if (!matchContext && character.aliases) {
      for (const alias of character.aliases) {
        const aliasLowerCase = alias.toLowerCase();
        const aliasPinyin = await convertToPinyin(alias);

        if (aliasLowerCase.includes(lowerCaseQuery)) {
          matchContext = `${character.id} (${alias})`;
          priority = 0.98;
          isPinyinMatch = false;
          break;
        } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = `${character.id} (${alias})`;
          priority = 0.97;
          isPinyinMatch = true;
          break;
        }
      }
    } else if (character.skills) {
      for (const skill of character.skills) {
        const skillNameLowerCase = skill.name.toLowerCase();
        const skillNamePinyin = await convertToPinyin(skill.name);

        if (skillNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([skill.name]);
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (skillNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([skill.name]);
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext) {
      for (const skill of character.skills) {
        if (skill.aliases) {
          for (const alias of skill.aliases) {
            const aliasLowerCase = alias.toLowerCase();
            const aliasPinyin = await convertToPinyin(alias);

            if (aliasLowerCase.includes(lowerCaseQuery)) {
              matchContext = `${skill.name} (${alias})`;
              priority = 0.84;
              isPinyinMatch = false;
              break;
            } else if (aliasPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
              matchContext = `${skill.name} (${alias})`;
              priority = 0.83;
              isPinyinMatch = true;
              break;
            }
          }
        }
      }
    }
    if (!matchContext) {
      const descriptionLowerCase = character.description.toLowerCase();
      const descriptionPinyin = await convertToPinyin(character.description);

      if (descriptionLowerCase.includes(lowerCaseQuery)) {
        matchContext = character.description;
        priority = 0.8;
        isPinyinMatch = false;
      } else if (descriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
        matchContext = character.description;
        priority = 0.75;
        isPinyinMatch = true;
      }
    }
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        const tagNameLowerCase = tag.tagName.toLowerCase();
        const tagNamePinyin = await convertToPinyin(tag.tagName);

        if (tagNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([tag.tagName]);
          priority = 0.7;
          isPinyinMatch = false;
          break;
        } else if (tagNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([tag.tagName]);
          priority = 0.65;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        const tagNameLowerCase = tag.tagName.toLowerCase();
        const tagNamePinyin = await convertToPinyin(tag.tagName);

        if (tagNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([tag.tagName]);
          priority = 0.7;
          isPinyinMatch = false;
          break;
        } else if (tagNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([tag.tagName]);
          priority = 0.65;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        const tagDescriptionLowerCase = tag.description.toLowerCase();
        const tagDescriptionPinyin = await convertToPinyin(tag.description);

        if (tagDescriptionLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([tag.description]);
          priority = 0.6;
          isPinyinMatch = false;
          break;
        } else if (tagDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([tag.description]);
          priority = 0.55;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        const tagDescriptionLowerCase = tag.description.toLowerCase();
        const tagDescriptionPinyin = await convertToPinyin(tag.description);

        if (tagDescriptionLowerCase.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([tag.description]);
          priority = 0.6;
          isPinyinMatch = false;
          break;
        } else if (tagDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([tag.description]);
          priority = 0.55;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        const additionalDescriptionLowerCase = tag.additionalDescription?.toLowerCase();
        const additionalDescriptionPinyin = await convertToPinyin(tag.additionalDescription);

        if (additionalDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([tag.additionalDescription]);
          priority = 0.5;
          isPinyinMatch = false;
          break;
        } else if (additionalDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([tag.additionalDescription]);
          priority = 0.45;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        const additionalDescriptionLowerCase = tag.additionalDescription?.toLowerCase();
        const additionalDescriptionPinyin = await convertToPinyin(tag.additionalDescription);

        if (additionalDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([tag.additionalDescription]);
          priority = 0.5;
          isPinyinMatch = false;
          break;
        } else if (additionalDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([tag.additionalDescription]);
          priority = 0.45;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.skills) {
      for (const skill of character.skills) {
        const skillDescriptionLowerCase = skill.description?.toLowerCase();
        const skillDescriptionPinyin = await convertToPinyin(skill.description);

        if (skill.description && skillDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([skill.description]);
          priority = 0.4;
          isPinyinMatch = false;
          break;
        } else if (skillDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([skill.description]);
          priority = 0.35;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.skills) {
      for (const skill of character.skills) {
        const detailedDescriptionLowerCase = skill.detailedDescription?.toLowerCase();
        const detailedDescriptionPinyin = await convertToPinyin(skill.detailedDescription);

        if (skill.detailedDescription && detailedDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = await findMatchContext([skill.detailedDescription]);
          priority = 0.3;
          isPinyinMatch = false;
          break;
        } else if (detailedDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = await findMatchContext([skill.detailedDescription]);
          priority = 0.25;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      yield {
        type: 'character',
        id: character.id,
        imageUrl: character.imageUrl!,
        matchContext: matchContext,
        priority: priority,
        isPinyinMatch: isPinyinMatch,
      };
    }
  }
}
