import { characters, cards } from '@/data';
import { Character, Card } from '@/data/types';

// Define a union type for search results
export type SearchResult =
  | ({ type: 'character'; matchContext: string; priority: number } & Pick<
      Character,
      'id' | 'imageUrl'
    >)
  | ({ type: 'card'; matchContext: string; priority: number } & Pick<Card, 'id' | 'imageUrl'>);

export const performSearch = async function* (query: string): AsyncGenerator<SearchResult> {
  const lowerCaseQuery = query.toLowerCase().trim(); // Trim whitespace

  if (!lowerCaseQuery) {
    // If query is empty or only whitespace, yield no results
    return;
  }

  // Helper function to find the first matching string and return its sentence context
  const findMatchContext = (texts: (string | undefined)[]): string | undefined => {
    for (const text of texts) {
      if (text) {
        const lowerCaseText = text.toLowerCase();
        const matchIndex = lowerCaseText.indexOf(lowerCaseQuery);

        if (matchIndex !== -1) {
          let startIndex = 0;

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
      }
    }
    return undefined;
  };

  // Search characters
  for (const character of Object.values(characters)) {
    let matchContext: string | undefined;
    let priority: number = 0;

    // Check character ID
    if (character.id.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = character.id;
      priority = 1.0;
    }
    // Check character skills name
    else if (character.skills) {
      for (const skill of character.skills) {
        if (skill.name.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([skill.name]);
          priority = 0.9;
          break;
        }
      }
    }
    // Check character description
    if (!matchContext && character.description.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = character.description;
      priority = 0.8;
    }
    // Check character positioning tags name
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        if (tag.tagName.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.tagName]);
          priority = 0.7;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        if (tag.tagName.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.tagName]);
          priority = 0.7;
          break;
        }
      }
    }
    // Check character positioning tags description
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        if (tag.description.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.description]);
          priority = 0.6;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        if (tag.description.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.description]);
          priority = 0.6;
          break;
        }
      }
    }
    // Check character positioning tags additionalDescription
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        if (tag.additionalDescription?.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.additionalDescription]);
          priority = 0.5;
          break;
        }
      }
    }
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        if (tag.additionalDescription?.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([tag.additionalDescription]);
          priority = 0.5;
          break;
        }
      }
    }
    // Check character skill description
    if (!matchContext && character.skills) {
      for (const skill of character.skills) {
        if (skill.description && skill.description.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([skill.description]);
          priority = 0.4;
          break;
        }
      }
    }
    // Check character skill detailedDescription
    if (!matchContext && character.skills) {
      for (const skill of character.skills) {
        if (
          skill.detailedDescription &&
          skill.detailedDescription.toLowerCase().includes(lowerCaseQuery)
        ) {
          matchContext = findMatchContext([skill.detailedDescription]);
          priority = 0.3;
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
      };
    }
  }

  // Search cards
  for (const card of Object.values(cards)) {
    let matchContext: string | undefined;
    let priority: number = 0;

    // Check card ID
    if (card.id.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.id;
      priority = 0.2;
    }
    // Check card description
    else if (card.description.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.description;
      priority = 0.18;
    }
    // Check detailed description
    else if (card.detailedDescription?.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.detailedDescription;
      priority = 0.16;
    }
    // Check levels description
    else if (card.levels) {
      for (const level of card.levels) {
        if (level.description.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([level.description]);
          priority = 0.14;
          break;
        }
      }
    }
    // Check levels detailedDescription
    if (!matchContext && card.levels) {
      for (const level of card.levels) {
        if (level.detailedDescription?.toLowerCase().includes(lowerCaseQuery)) {
          matchContext = findMatchContext([level.detailedDescription]);
          priority = 0.12;
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
      };
    }
  }
};
