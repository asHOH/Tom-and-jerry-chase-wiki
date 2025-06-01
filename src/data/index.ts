// Re-export types for backward compatibility
export type { FactionId, Faction, Character, Skill, SkillLevel, Card, CardLevel, CardRank, PositioningTag, PositioningTagName } from './types';

// Import character data from separated files
import { catCharactersWithImages } from './catCharacters';
import { mouseCharactersWithImages } from './mouseCharacters';
import { catCardsWithImages } from './catKnowledgeCards';
import { mouseCardsWithImages } from './mouseKnowledgeCards';
import { FactionId, Faction } from './types';

/* -------------------------------------------------------------------------- */
export const factionData: Record<FactionId, Faction> = {
  cat: {
    id: 'cat',
    name: '猫阵营',
    description: '猫阵营需要阻止老鼠推奶酪，并将老鼠绑上火箭放飞',
  },
  mouse: {
    id: 'mouse',
    name: '鼠阵营',
    description: '鼠阵营共四名角色，需要合作躲避猫的攻击、推完5块奶酪并砸开墙缝',
  }
};

/* -------------------------------------------------------------------------- */
// Combine all character data
export const characterData = {
  ...catCharactersWithImages,
  ...mouseCharactersWithImages
};

// Combine all card data
export const cardData = {
  ...catCardsWithImages,
  ...mouseCardsWithImages
};

// Generate derived data structures for the application
// 1. Create factions with their characters
export const factions = Object.fromEntries(
  Object.entries(factionData).map(([factionId, faction]) => {
    // Get all characters belonging to this faction
    const factionCharacters = Object.values(characterData)
      .filter(character => character.factionId === factionId)
      .map((character) => {
        // Get positioning tags based on faction
        const positioningTags = factionId === 'cat' 
          ? character.catPositioningTags || []
          : character.mousePositioningTags || [];
        
        return {
          id: character.id,
          name: character.id, // Use id as name since they're now the same
          imageUrl: character.imageUrl!,
          positioningTags: positioningTags // Include positioning tags for both cat and mouse characters
        };
      });

    return [factionId, { ...faction, characters: factionCharacters }];
  })
);

// 2. Create characters with faction objects
export const characters = Object.fromEntries(
  Object.entries(characterData).map(([characterId, character]) => {
    // Use type assertion to ensure TypeScript knows factionId is valid
    const factionId = character.factionId as FactionId;
    const faction = factionData[factionId];

    return [characterId, {
      ...character,
      imageUrl: character.imageUrl!,
      faction: { id: faction.id, name: faction.name }
    }];
  })
);

// 3. Create faction cards data structures
export const factionCards = Object.fromEntries(
  Object.entries(factionData).map(([factionId, faction]) => {
    // Get all cards belonging to this faction
    const factionCardList = Object.values(cardData)
      .filter(card => card.factionId === factionId)
      .map(({ id, rank, cost, imageUrl }) => ({
        id,
        name: id, // Use id as name since they're now the same
        rank,
        cost,
        imageUrl: imageUrl!
      }));

    return [factionId, { ...faction, cards: factionCardList }];
  })
);

// 4. Create cards with faction objects
export const cards = Object.fromEntries(
  Object.entries(cardData).map(([cardId, card]) => {
    const factionId = card.factionId as FactionId;
    const faction = factionData[factionId];

    return [cardId, {
      ...card,
      imageUrl: card.imageUrl!,
      faction: { id: faction.id, name: faction.name }
    }];
  })
);
