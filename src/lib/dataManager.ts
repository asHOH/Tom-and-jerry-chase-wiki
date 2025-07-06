import { catCharactersWithImages } from '@/data/catCharacters';
import { mouseCharactersWithImages } from '@/data/mouseCharacters';
import { catCardsWithImages } from '@/data/catKnowledgeCards';
import { mouseCardsWithImages } from '@/data/mouseKnowledgeCards';
import { FactionId, Faction } from '@/data/types';

// Raw data aggregation
const rawCharacterData = {
  ...catCharactersWithImages,
  ...mouseCharactersWithImages,
};

const rawCardData = {
  ...catCardsWithImages,
  ...mouseCardsWithImages,
};

const rawFactionData: Record<FactionId, Faction> = {
  cat: {
    id: 'cat',
    name: '猫阵营',
    description: '猫阵营需要阻止老鼠推奶酪，并将老鼠绑上火箭放飞',
  },
  mouse: {
    id: 'mouse',
    name: '鼠阵营',
    description: '鼠阵营共四名角色，需要合作躲避猫的攻击、推完5块奶酪并砸开墙缝',
  },
};

/**
 * Data Manager - Handles all data transformations
 * Provides a clean interface for accessing processed game data
 */
export class GameDataManager {
  /**
   * Get factions with their associated characters
   */
  static getFactions() {
    return Object.fromEntries(
      Object.entries(rawFactionData).map(([factionId, faction]) => {
        const factionCharacters = Object.values(rawCharacterData)
          .filter((character) => character.factionId === factionId)
          .map((character) => {
            const positioningTags =
              factionId === 'cat'
                ? character.catPositioningTags || []
                : character.mousePositioningTags || [];

            return {
              id: character.id,
              name: character.id,
              imageUrl: character.imageUrl!,
              positioningTags,
            };
          });

        return [factionId, { ...faction, characters: factionCharacters }];
      })
    );
  }

  /**
   * Get characters with faction references
   */
  static getCharacters() {
    return Object.fromEntries(
      Object.entries(rawCharacterData).map(([characterId, character]) => {
        const factionId = character.factionId as FactionId;
        const faction = rawFactionData[factionId];

        return [
          characterId,
          {
            ...character,
            imageUrl: character.imageUrl!,
            faction: { id: faction.id, name: faction.name },
          },
        ];
      })
    );
  }

  /**
   * Get faction cards with their associated cards
   */
  static getFactionCards() {
    return Object.fromEntries(
      Object.entries(rawFactionData).map(([factionId, faction]) => {
        const factionCardList = Object.values(rawCardData)
          .filter((card) => card.factionId === factionId)
          .map(({ id, rank, cost, imageUrl }) => ({
            id,
            name: id,
            rank,
            cost,
            imageUrl: imageUrl!,
          }));

        return [factionId, { ...faction, cards: factionCardList }];
      })
    );
  }

  /**
   * Get cards with faction references
   */
  static getCards() {
    return Object.fromEntries(
      Object.entries(rawCardData).map(([cardId, card]) => {
        const factionId = card.factionId as FactionId;
        const faction = rawFactionData[factionId];

        return [
          cardId,
          {
            ...card,
            imageUrl: card.imageUrl!,
            faction: { id: faction.id, name: faction.name },
          },
        ];
      })
    );
  }

  /**
   * Get raw data for direct access (when needed)
   */
  static getRawData() {
    return {
      factionData: rawFactionData,
      characterData: rawCharacterData,
      cardData: rawCardData,
    };
  }
}
