// Utility functions for skill-related operations

import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import type { Skill, FactionId, CancelableSkillType, CancelableAftercastType } from '../data/types';

/**
 * Generate skill image URL based on character name, skill type, and skill name
 */
export const getSkillImageUrl = (
  characterName: string,
  skill: Skill,
  factionId: FactionId
): string => {
  if (skill.type === 'passive') {
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
const getSkillNumber = (skillType: 'active' | 'weapon1' | 'weapon2' | 'passive'): string => {
  switch (skillType) {
    case 'active':
      return '1';
    case 'weapon1':
      return '2';
    case 'weapon2':
      return '3';
    case 'passive':
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
  return skills.map((skill) => ({
    ...skill,
    imageUrl: getSkillImageUrl(characterName, skill, factionId),
  }));
};

export function convertCancelableSkillToDisplayText(
  skill: DeepReadonly<CancelableSkillType> | undefined
) {
  if (typeof skill === 'string') {
    return skill; // Directly return if it's a string
  } else if (Array.isArray(skill)) {
    const len = skill.length;
    if (len === 0) return '';
    if (len === 1) return `可被${skill[0]}打断`;
    if (len === 2) return `可被${skill[0]}或${skill[1]}打断`;
    return `可被${skill.slice(0, len - 2).join('、')}、${skill[len - 2]}或${skill[len - 1]}打断`;
  }
  return '不确定是否可被打断';
}

/**
 * Converts CancelableAftercastType to display text.
 */
export function convertCancelableAftercastToDisplayText(
  aftercast: DeepReadonly<CancelableAftercastType> | undefined
) {
  if (typeof aftercast === 'string') {
    return aftercast;
  } else if (Array.isArray(aftercast)) {
    const len = aftercast.length;
    if (len === 0) return '';
    if (len === 1) return `可被${aftercast[0]}取消后摇`;
    if (len === 2) return `可被${aftercast[0]}或${aftercast[1]}取消后摇`;
    return `可被${aftercast.slice(0, len - 2).join('、')}、${aftercast[len - 2]}或${aftercast[len - 1]}取消后摇`;
  }
  return '不确定是否可取消后摇';
}
