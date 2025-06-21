import { characters, cards } from '@/data';
import { Character, Card } from '@/data/types';

// Define a union type for search results
export type SearchResult =
  | ({ type: 'character'; matchContext: string } & Pick<Character, 'id' | 'imageUrl'>)
  | ({ type: 'card'; matchContext: string } & Pick<Card, 'id' | 'imageUrl'>);

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

    // Check character ID
    if (character.id.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = character.id;
    }
    // Check character description
    else if (character.description.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = character.description;
    }
    // Check skills
    else if (character.skills) {
      for (const skill of character.skills) {
        matchContext = findMatchContext([skill.name, skill.description, skill.detailedDescription]);
        if (matchContext) break;
      }
    }
    // Check cat positioning tags
    if (!matchContext && character.catPositioningTags) {
      for (const tag of character.catPositioningTags) {
        matchContext = findMatchContext([tag.tagName, tag.description, tag.additionalDescription]);
        if (matchContext) break;
      }
    }
    // Check mouse positioning tags
    if (!matchContext && character.mousePositioningTags) {
      for (const tag of character.mousePositioningTags) {
        matchContext = findMatchContext([tag.tagName, tag.description, tag.additionalDescription]);
        if (matchContext) break;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async work
      yield {
        type: 'character',
        id: character.id,
        imageUrl: character.imageUrl!,
        matchContext: matchContext,
      };
    }
  }

  // Search cards
  for (const card of Object.values(cards)) {
    let matchContext: string | undefined;

    // Check card ID
    if (card.id.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.id;
    }
    // Check card description
    else if (card.description.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.description;
    }
    // Check detailed description
    else if (card.detailedDescription?.toLowerCase().includes(lowerCaseQuery)) {
      matchContext = card.detailedDescription;
    }
    // Check levels
    else if (card.levels) {
      for (const level of card.levels) {
        matchContext = findMatchContext([level.description, level.detailedDescription]);
        if (matchContext) break;
      }
    }

    if (matchContext) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate async work
      yield {
        type: 'card',
        id: card.id,
        imageUrl: card.imageUrl!,
        matchContext: matchContext,
      };
    }
  }
};
