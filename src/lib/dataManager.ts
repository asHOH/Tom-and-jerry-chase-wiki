import { DeepReadonly } from '@/types/deep-readonly';
import { historyData } from '@/data/history';
import { Card, Character, Faction, FactionId } from '@/data/types';
import { createCatCharactersWithImages } from '@/features/characters/data/catCharacters';
import { createMouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';
import { mergeCharacterRecommendations } from '@/features/characters/utils/recommendations';
import catGeneralKnowledgeCardGroups from '@/features/knowledge-cards/data/catGeneralKnowledgeCardGroups';
import { createCatCardsWithImages } from '@/features/knowledge-cards/data/catKnowledgeCards';
import mouseGeneralKnowledgeCardGroups from '@/features/knowledge-cards/data/mouseGeneralKnowledgeCardGroups';
import { createMouseCardsWithImages } from '@/features/knowledge-cards/data/mouseKnowledgeCards';
import catGeneralSpecialSkills from '@/features/special-skills/data/catGeneralSpecialSkills';
import mouseGeneralSpecialSkills from '@/features/special-skills/data/mouseGeneralSpecialSkills';

// Raw data aggregation
const rawCharacterData = {
  ...createCatCharactersWithImages(),
  ...createMouseCharactersWithImages(),
};

const rawCardData = {
  ...createCatCardsWithImages(),
  ...createMouseCardsWithImages(),
};

const rawFactionData: Record<FactionId, Faction> = {
  cat: {
    id: 'cat',
    name: '猫阵营',
    description: '猫阵营需要阻止老鼠推奶酪，并将老鼠绑上火箭放飞',
    generalKnowledgeCardGroups: catGeneralKnowledgeCardGroups,
    generalSpecialSkills: catGeneralSpecialSkills,
  },
  mouse: {
    id: 'mouse',
    name: '鼠阵营',
    description: '鼠阵营共四名角色，需要合作躲避猫的攻击、推完5块奶酪并砸开墙缝',
    generalKnowledgeCardGroups: mouseGeneralKnowledgeCardGroups,
    generalSpecialSkills: mouseGeneralSpecialSkills,
  },
};

const createTimeLookup = new Map<string, string>();

function populateCreateTimeLookup() {
  if (createTimeLookup.size) return;

  for (const entry of historyData) {
    for (const event of entry.events) {
      const additions = [
        ...(event.details.content?.newCharacters ?? []),
        ...(event.details.content?.newItems ?? []),
        ...(event.details.content?.newKnowledgeCards ?? []),
        ...(event.details.content?.newSecondWeapons ?? []),
      ];

      for (const item of additions) {
        if (!createTimeLookup.has(item)) {
          createTimeLookup.set(item, `${entry.year}.${event.date.split('-')[0]}`);
        }
      }
    }
  }
}

function getCreateTime(name: string) {
  if (!createTimeLookup.size) {
    populateCreateTimeLookup();
  }

  return createTimeLookup.get(name) ?? null;
}

export type CharacterGameData = Record<
  string,
  Character & {
    imageUrl: string;
    faction: { id: FactionId; name: string };
    createDate: string | null;
  }
>;

export type CardGameData = Record<
  string,
  Card & {
    imageUrl: string;
    faction: { id: FactionId; name: string };
    createDate: string | null;
  }
>;

export function buildCharacterGameData(): CharacterGameData {
  const built = Object.fromEntries(
    Object.entries(rawCharacterData).map(([characterId, character]) => {
      const factionId = character.factionId as FactionId;
      const faction = rawFactionData[factionId];
      const recommendations = mergeCharacterRecommendations(character, faction);

      return [
        characterId,
        {
          ...character,
          ...recommendations,
          imageUrl: character.imageUrl!,
          faction: { id: faction.id, name: faction.name },
          createDate: getCreateTime(character.id),
        },
      ];
    })
  );

  return structuredClone(built) as CharacterGameData;
}

export function buildCardGameData(): CardGameData {
  const built = Object.fromEntries(
    Object.entries(rawCardData).map(([cardId, card]) => {
      const factionId = card.factionId as FactionId;
      const faction = rawFactionData[factionId];

      return [
        cardId,
        {
          ...card,
          imageUrl: card.imageUrl!,
          faction: { id: faction.id, name: faction.name },
          createDate: getCreateTime(card.id),
        },
      ];
    })
  );

  return structuredClone(built) as CardGameData;
}

// Simple memoization utility for functions with no arguments
/**
 * Data Manager - Handles all data transformations
 * Provides a clean interface for accessing processed game data
 */
export class GameDataManager {
  static getFactionsWithCharacters(characters: DeepReadonly<Record<string, Character>>) {
    return Object.fromEntries(
      Object.entries(rawFactionData).map(([factionId, faction]) => {
        const factionCharacters = Object.values(characters)
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
              createDate: getCreateTime(character.id),
              positioningTags,
            };
          });

        return [factionId, { ...faction, characters: factionCharacters }];
      })
    );
  }

  // Module-scoped caches (lazy-initialized)
  private static _charactersCache: Readonly<CharacterGameData> | null = null;
  private static _cardsCache: Readonly<CardGameData> | null = null;

  /**
   * Clear memoized caches. If no options provided, clears all.
   */
  static invalidate(opts?: { characters?: boolean; cards?: boolean; factions?: boolean }) {
    const all = !opts || (!opts.characters && !opts.cards && !opts.factions);
    if (all || opts?.characters) {
      this._charactersCache = null;
      // Factions depend on characters; clear as well
    }
    if (all || opts?.cards) this._cardsCache = null;
  }

  static getCharacters(): Readonly<CharacterGameData> {
    if (this._charactersCache) return this._charactersCache;
    this._charactersCache = buildCharacterGameData();
    return this._charactersCache!;
  }

  static getCards(): Readonly<CardGameData> {
    if (this._cardsCache) return this._cardsCache;
    this._cardsCache = buildCardGameData();
    return this._cardsCache!;
  }

  /**
   * Get raw data for direct access (when needed)
   */
  static getRawData() {
    return structuredClone({
      factionData: rawFactionData,
      characterData: rawCharacterData,
      cardData: rawCardData,
    });
  }
}
