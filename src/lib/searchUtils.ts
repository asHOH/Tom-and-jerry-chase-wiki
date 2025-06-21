import { characters, cards } from '@/data';
import { Character, Card, Skill } from '@/data/types';

// Define a union type for search results
export type SearchResult =
  | ({ type: 'character' } & Pick<Character, 'id' | 'imageUrl'>)
  | ({ type: 'card' } & Pick<Card, 'id' | 'imageUrl'>);

export const performSearch = (query: string): SearchResult[] => {
  const lowerCaseQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  // Search characters
  Object.values(characters).forEach((character) => {
    const characterMatches =
      character.id.toLowerCase().includes(lowerCaseQuery) ||
      character.description.toLowerCase().includes(lowerCaseQuery) || // description is required
      (character.skills &&
        character.skills.some(
          (skill: Skill) =>
            skill.name.toLowerCase().includes(lowerCaseQuery) ||
            (skill.description?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
            (skill.detailedDescription?.toLowerCase().includes(lowerCaseQuery) ?? false)
        )) ||
      (character.catPositioningTags &&
        character.catPositioningTags.some(
          (tag) =>
            tag.tagName.toLowerCase().includes(lowerCaseQuery) ||
            tag.description.toLowerCase().includes(lowerCaseQuery) ||
            (tag.additionalDescription?.toLowerCase().includes(lowerCaseQuery) ?? false)
        )) ||
      (character.mousePositioningTags &&
        character.mousePositioningTags.some(
          (tag) =>
            tag.tagName.toLowerCase().includes(lowerCaseQuery) ||
            tag.description.toLowerCase().includes(lowerCaseQuery) ||
            (tag.additionalDescription?.toLowerCase().includes(lowerCaseQuery) ?? false)
        ));

    if (characterMatches) {
      results.push({
        type: 'character',
        id: character.id,
        imageUrl: character.imageUrl!,
      });
    }
  });

  // Search cards
  Object.values(cards).forEach((card) => {
    const cardMatches =
      card.id.toLowerCase().includes(lowerCaseQuery) ||
      card.description.toLowerCase().includes(lowerCaseQuery) || // description is required
      (card.detailedDescription?.toLowerCase().includes(lowerCaseQuery) ?? false) ||
      (card.levels &&
        card.levels.some(
          (level) =>
            level.description.toLowerCase().includes(lowerCaseQuery) ||
            (level.detailedDescription?.toLowerCase().includes(lowerCaseQuery) ?? false)
        ));

    if (cardMatches) {
      results.push({
        type: 'card',
        id: card.id,
        imageUrl: card.imageUrl!,
      });
    }
  });

  return results;
};
