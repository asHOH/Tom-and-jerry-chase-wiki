import { catCharactersWithImages } from '@/data/catCharacters';
import { catCardsWithImages } from '@/data/catKnowledgeCards';
import { historyData } from '@/data/history';
import { mouseCharactersWithImages } from '@/data/mouseCharacters';
import { mouseCardsWithImages } from '@/data/mouseKnowledgeCards';
import { Card, Character, Faction, FactionId, PositioningTag } from '@/data/types';

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

// Simple memoization utility for functions with no arguments
/**
 * Data Manager - Handles all data transformations
 * Provides a clean interface for accessing processed game data
 */
export class GameDataManager {
  static getFactionsWithCharacters(characters: Record<string, Character>) {
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
  private static _charactersCache: Readonly<
    Record<
      string,
      Character & {
        imageUrl: string;
        faction: { id: FactionId; name: string };
        createDate: string | null;
      }
    >
  > | null = null;
  private static _cardsCache: Readonly<
    Record<
      string,
      Card & {
        imageUrl: string;
        faction: { id: FactionId; name: string };
        createDate: string | null;
      }
    >
  > | null = null;
  private static _factionsCache: Readonly<
    Record<
      string,
      Faction & {
        characters: Array<{
          id: string;
          name: string;
          imageUrl: string;
          positioningTags: PositioningTag[];
          createDate: string | null;
        }>;
      }
    >
  > | null = null;

  /**
   * Clear memoized caches. If no options provided, clears all.
   */
  static invalidate(opts?: { characters?: boolean; cards?: boolean; factions?: boolean }) {
    const all = !opts || (!opts.characters && !opts.cards && !opts.factions);
    if (all || opts?.characters) {
      this._charactersCache = null;
      // Factions depend on characters; clear as well
      this._factionsCache = null;
    }
    if (all || opts?.cards) this._cardsCache = null;
    if (all || opts?.factions) this._factionsCache = null;
  }

  static getFactions(): Readonly<
    Record<
      string,
      Faction & {
        characters: Array<{
          id: string;
          name: string;
          imageUrl: string;
          positioningTags: PositioningTag[];
          createDate: string | null;
        }>;
      }
    >
  > {
    if (this._factionsCache) return this._factionsCache;
    const characters = this.getCharacters();
    const built = this.getFactionsWithCharacters(characters);
    this._factionsCache = built as Record<
      string,
      Faction & {
        characters: Array<{
          id: string;
          name: string;
          imageUrl: string;
          positioningTags: PositioningTag[];
          createDate: string | null;
        }>;
      }
    >;
    return this._factionsCache!;
  }

  static getCharacters(): Readonly<
    Record<
      string,
      Character & {
        imageUrl: string;
        faction: { id: FactionId; name: string };
        createDate: string | null;
      }
    >
  > {
    if (this._charactersCache) return this._charactersCache;
    const built = Object.fromEntries(
      Object.entries(rawCharacterData).map(([characterId, character]) => {
        const factionId = character.factionId as FactionId;
        const faction = rawFactionData[factionId];

        return [
          characterId,
          {
            ...character,
            imageUrl: character.imageUrl!,
            faction: { id: faction.id, name: faction.name },
            createDate: getCreateTime(character.id),
          },
        ];
      })
    );
    this._charactersCache = built as Record<
      string,
      Character & {
        imageUrl: string;
        faction: { id: FactionId; name: string };
        createDate: string | null;
      }
    >;
    return this._charactersCache!;
  }

  static getCards(): Readonly<
    Record<
      string,
      Card & {
        imageUrl: string;
        faction: { id: FactionId; name: string };
        createDate: string | null;
      }
    >
  > {
    if (this._cardsCache) return this._cardsCache;
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
    this._cardsCache = built as Record<
      string,
      Card & {
        imageUrl: string;
        faction: { id: FactionId; name: string };
        createDate: string | null;
      }
    >;
    return this._cardsCache!;
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
