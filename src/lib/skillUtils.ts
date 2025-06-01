// Utility functions for skill-related operations

import type { Skill, FactionId } from '../data/types';

/**
 * Generate skill image URL based on character name, skill type, and skill name
 */
export const getSkillImageUrl = (
  characterName: string,
  skill: Skill,
  factionId: FactionId
): string => {
  if (skill.type === 'PASSIVE') {
    // Passive skills use faction-based naming: 被动-猫.png or 被动-鼠.png
    const factionName = factionId === 'cat' ? '猫' : '鼠';
    return `/images/${factionId}Skills/被动-${factionName}.png`;
  }

  // For active skills, use character name + skill number + skill name
  const skillNumber = getSkillNumber(skill.type);
  return `/images/${factionId}Skills/${characterName}${skillNumber}-${skill.name}.png`;
};

/**
 * Get skill number based on skill type
 */
const getSkillNumber = (skillType: 'ACTIVE' | 'WEAPON1' | 'WEAPON2' | 'PASSIVE'): string => {
  switch (skillType) {
    case 'ACTIVE':
      return '1';
    case 'WEAPON1':
      return '2';
    case 'WEAPON2':
      return '3';
    case 'PASSIVE':
      return '';
    default:
      return '';
  }
};

/**
 * Add image URLs to character skills
 */
export const addSkillImageUrls = (
  characterName: string,
  skills: Skill[],
  factionId: FactionId
): Skill[] => {
  return skills.map(skill => ({
    ...skill,
    imageUrl: getSkillImageUrl(characterName, skill, factionId)
  }));
};
