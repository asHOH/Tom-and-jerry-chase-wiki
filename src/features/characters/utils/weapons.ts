import { characters } from '@/data';
import type { FactionId, Skill } from '@/data/types';

import { AssetManager } from '@/lib/assetManager';

/**
 * Get weapon skill image URL for a character
 */
export const getWeaponSkillImageUrl = (
  characterId: string,
  weaponNumber: 1 | 2,
  factionId: FactionId
): string | null => {
  const character = characters[characterId];
  if (!character) return null;

  // Find the weapon skill based on weapon number
  const weaponSkill = character.skills.find((skill) => {
    return (
      (weaponNumber === 1 && skill.type === 'weapon1') ||
      (weaponNumber === 2 && skill.type === 'weapon2')
    );
  });

  if (!weaponSkill) return null;

  // Use existing utility to generate the image URL
  // The skill should have an id property when it comes from the processed characters
  return AssetManager.getSkillImageUrl(characterId, weaponSkill as Skill, factionId);
};
