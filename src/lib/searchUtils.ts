import { characters, cards } from '@/data';
import { Character, Card } from '@/data/types';
import { convertToPinyin } from './pinyinUtils'; // Import the pinyin utility

// Define a union type for search results
export type SearchResult =
  | ({ type: 'character'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Character,
      'id' | 'imageUrl'
    >)
  | ({ type: 'card'; matchContext: string; priority: number; isPinyinMatch: boolean } & Pick<
      Card,
      'id' | 'imageUrl'
    >);

export const performSearch = async function* (query: string): AsyncGenerator<SearchResult> {
  const lowerCaseQuery = query.toLowerCase().trim(); // Trim whitespace
  // Remove apostrophes from the query before converting to pinyin, as they are not part of pinyin for search
  const cleanedQuery = lowerCaseQuery.replace(/'/g, '');
  // const pinyinQuery = convertToPinyin(cleanedQuery); // Convert query to pinyin
  const pinyinQuery = cleanedQuery;

  if (!lowerCaseQuery) {
    // If query is empty or only whitespace, yield no results
    return;
  }

  // Helper function to find the first matching string and return its sentence context
  const findMatchContext = (texts: (string | undefined)[]): string | undefined => {
    for (const text of texts) {
      if (text) {
        const lowerCaseText = text.toLowerCase();
        const pinyinText = convertToPinyin(text);

        // Check for direct match
        if (lowerCaseText.includes(lowerCaseQuery)) {
          let startIndex = 0;
          const matchIndex = lowerCaseText.indexOf(lowerCaseQuery);

          // 1. Find sentence start (., !, ?) before the match
          for (let i = matchIndex - 1; i >= 0; i--) {
            const char = text.charAt(i);
            if (['.', '!', '?'].includes(char)) {
              startIndex = i + 1;
              break;
            }
          }

          // 2. Find first comma after sentence start and before the match
          for (let i = startIndex; i < matchIndex; i++) {
            const char = text.charAt(i);
            if (char === ',' || char === '，') {
              startIndex = i + 1;
              break;
            }
          }
          return text.substring(startIndex).trim();
        }

        // Check for pinyin match
        if (pinyinText.includes(pinyinQuery) && pinyinQuery.length > 0) {
          // For pinyin matches, return the full text for context,
          // as highlighting pinyin within Chinese text is complex.
          return text.trim();
        }
      }
    }
    return undefined;
  };

  // Search characters
  for (const character of Object.values(characters)) {
    let matchContext: string | undefined;
    let priority: number = 0;
    let isPinyinMatch: boolean = false;

    const characterIdLowerCase = character.id.toLowerCase();
    const characterIdPinyin = convertToPinyin(character.id);

    // Check character ID (direct match)
    if (characterIdLowerCase.includes(lowerCaseQuery)) {
      matchContext = character.id;
      priority = 1.0;
      isPinyinMatch = false;
    }
    // Check character ID (pinyin match)
    else if (characterIdPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
      matchContext = character.id;
      priority = 0.95; // Slightly lower priority for pinyin ID match
      isPinyinMatch = true;
    }
    // Check character skills name
    else if (character.skills) {
      for (const skill of character.skills) {
        const skillNameLowerCase = skill.name.toLowerCase();
        const skillNamePinyin = convertToPinyin(skill.name);

        if (skillNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([skill.name]);
          priority = 0.9;
          isPinyinMatch = false;
          break;
        } else if (skillNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([skill.name]);
          priority = 0.85;
          isPinyinMatch = true;
          break;
        }
      }
    }
    // Check character description
    if (!matchContext) {
      const descriptionLowerCase = character.description.toLowerCase();
      const descriptionPinyin = convertToPinyin(character.description);

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
    // Check character positioning tags name
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        const tagNameLowerCase = tag.tagName.toLowerCase();
        const tagNamePinyin = convertToPinyin(tag.tagName);

        if (tagNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.tagName]);
          priority = 0.7;
          isPinyinMatch = false;
          break;
        } else if (tagNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([tag.tagName]);
          priority = 0.65;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        const tagNameLowerCase = tag.tagName.toLowerCase();
        const tagNamePinyin = convertToPinyin(tag.tagName);

        if (tagNameLowerCase.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.tagName]);
          priority = 0.7;
          isPinyinMatch = false;
          break;
        } else if (tagNamePinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([tag.tagName]);
          priority = 0.65;
          isPinyinMatch = true;
          break;
        }
      }
    }
    // Check character positioning tags description
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        const tagDescriptionLowerCase = tag.description.toLowerCase();
        const tagDescriptionPinyin = convertToPinyin(tag.description);

        if (tagDescriptionLowerCase.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.description]);
          priority = 0.6;
          isPinyinMatch = false;
          break;
        } else if (tagDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([tag.description]);
          priority = 0.55;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        const tagDescriptionLowerCase = tag.description.toLowerCase();
        const tagDescriptionPinyin = convertToPinyin(tag.description);

        if (tagDescriptionLowerCase.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.description]);
          priority = 0.6;
          isPinyinMatch = false;
          break;
        } else if (tagDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([tag.description]);
          priority = 0.55;
          isPinyinMatch = true;
          break;
        }
      }
    }
    // Check character positioning tags additionalDescription
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        const additionalDescriptionLowerCase = tag.additionalDescription?.toLowerCase();
        const additionalDescriptionPinyin = convertToPinyin(tag.additionalDescription);

        if (additionalDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.additionalDescription]);
          priority = 0.5;
          isPinyinMatch = false;
          break;
        } else if (additionalDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([tag.additionalDescription]);
          priority = 0.45;
          isPinyinMatch = true;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        const additionalDescriptionLowerCase = tag.additionalDescription?.toLowerCase();
        const additionalDescriptionPinyin = convertToPinyin(tag.additionalDescription);

        if (additionalDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.additionalDescription]);
          priority = 0.5;
          isPinyinMatch = false;
          break;
        } else if (additionalDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([tag.additionalDescription]);
          priority = 0.45;
          isPinyinMatch = true;
          break;
        }
      }
    }
    // Check character skill description
    if (!matchContext && character.skills) {
      for (const skill of character.skills) {
        const skillDescriptionLowerCase = skill.description?.toLowerCase();
        const skillDescriptionPinyin = convertToPinyin(skill.description);

        if (skill.description && skillDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([skill.description]);
          priority = 0.4;
          isPinyinMatch = false;
          break;
        } else if (skillDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([skill.description]);
          priority = 0.35;
          isPinyinMatch = true;
          break;
        }
      }
    }
    // Check character skill detailedDescription
    if (!matchContext && character.skills) {
      for (const skill of character.skills) {
        const detailedDescriptionLowerCase = skill.detailedDescription?.toLowerCase();
        const detailedDescriptionPinyin = convertToPinyin(skill.detailedDescription);

        if (skill.detailedDescription && detailedDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([skill.detailedDescription]);
          priority = 0.3;
          isPinyinMatch = false;
          break;
        } else if (detailedDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([skill.detailedDescription]);
          priority = 0.25;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async work
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

  // Search cards
  for (const card of Object.values(cards)) {
    let matchContext: string | undefined;
    let priority: number = 0;
    let isPinyinMatch: boolean = false;

    const cardIdLowerCase = card.id.toLowerCase();
    const cardIdPinyin = convertToPinyin(card.id);

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
    } else if (convertToPinyin(card.description).includes(pinyinQuery) && pinyinQuery.length > 0) {
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
      convertToPinyin(card.detailedDescription).includes(pinyinQuery) &&
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
        const levelDescriptionPinyin = convertToPinyin(level.description);

        if (levelDescriptionLowerCase.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([level.description]);
          priority = 0.14;
          isPinyinMatch = false;
          break;
        } else if (levelDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([level.description]);
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
        const levelDetailedDescriptionPinyin = convertToPinyin(level.detailedDescription);

        if (levelDetailedDescriptionLowerCase?.includes(lowerCaseQuery)) {
          matchContext = findMatchContext([level.detailedDescription]);
          priority = 0.12;
          isPinyinMatch = false;
          break;
        } else if (levelDetailedDescriptionPinyin.includes(pinyinQuery) && pinyinQuery.length > 0) {
          matchContext = findMatchContext([level.detailedDescription]);
          priority = 0.11;
          isPinyinMatch = true;
          break;
        }
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async work
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
};
