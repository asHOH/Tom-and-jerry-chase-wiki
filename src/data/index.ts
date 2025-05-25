// Re-export types for backward compatibility
export type { FactionId, Faction, Character, Skill, SkillLevel } from './types';

// Import character data from separated files
import { catCharactersWithImages } from './catCharacters';
import { mouseCharactersWithImages } from './mouseCharacters';
import { FactionId, Faction } from './types';

/* -------------------------------------------------------------------------- */
export const factionData: Record<FactionId, Faction> = {
  cat: {
    id: 'cat',
    name: '猫阵营',
    description: '猫阵营需要阻止鼠阵营推奶酪，并将他们绑上火箭放飞',
  },
  mouse: {
    id: 'mouse',
    name: '鼠阵营',
    description: '鼠阵营共有4名角色，需要躲避猫的攻击、推完5块奶酪并砸开墙缝',
  }
};

/* -------------------------------------------------------------------------- */
// Combine all character data
export const characterData = {
  ...catCharactersWithImages,
  ...mouseCharactersWithImages
};

// Generate derived data structures for the application
// 1. Create factions with their characters
export const factions = Object.fromEntries(
  Object.entries(factionData).map(([factionId, faction]) => {
    // Get all characters belonging to this faction
    const factionCharacters = Object.values(characterData)
      .filter(character => character.factionId === factionId)
      .map(({ id, name, imageUrl }) => ({
        id,
        name,
        // Image URL is already generated in the character data
        imageUrl: imageUrl!
      }));

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
      // Image URL is already generated in the character data
      imageUrl: character.imageUrl!,
      faction: { id: faction.id, name: faction.name }
    }];
  })
);
