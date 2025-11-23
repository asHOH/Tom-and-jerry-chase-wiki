import type { FactionId, Skill, SkillType } from '@/data/types';

/**
 * Centralized asset manager for generating image URLs
 * Consolidates image URL generation logic from multiple scattered functions
 */
export class AssetManager {
  /**
   * Generate character image URL
   * @param characterId - The character's ID (Chinese name)
   * @param factionId - The faction ('cat' or 'mouse')
   * @returns Character image URL
   */
  static getCharacterImageUrl(characterId: string, factionId: FactionId): string {
    if (!characterId) {
      throw new Error('Character ID is required');
    }
    if (factionId !== 'cat' && factionId !== 'mouse') {
      throw new Error(`Invalid faction ID: ${factionId}. Expected 'cat' or 'mouse'.`);
    }

    const factionPath = factionId === 'cat' ? 'cats' : 'mice';
    return `/images/${factionPath}/${characterId}.png`;
  }

  /**
   * Generate skill image URL
   * @param characterName - The character's name
   * @param skill - The skill object
   * @param factionId - The faction ('cat' or 'mouse')
   * @returns Skill image URL
   */
  static getSkillImageUrl(characterName: string, skill: Skill, factionId: FactionId): string {
    if (!characterName) {
      throw new Error('Character name is required');
    }
    if (!skill) {
      throw new Error('Skill object is required');
    }
    if (factionId !== 'cat' && factionId !== 'mouse') {
      throw new Error(`Invalid faction ID: ${factionId}. Expected 'cat' or 'mouse'.`);
    }

    if (skill.type === 'passive') {
      // Passive skills use faction-based naming: 被动-猫.png or 被动-鼠.png
      const factionName = this.getFactionDisplayName(factionId);
      return `/images/${factionId}Skills/被动-${factionName}.png`;
    }

    // For active skills, use character name + skill number + skill name
    const skillNumber = this.getSkillNumber(skill.type);
    return `/images/${factionId}Skills/${characterName}${skillNumber}-${skill.name}.png`;
  }

  /**
   * Generate special skill image URL
   * @param skillName - The special skill name
   * @param factionId - The faction ('cat' or 'mouse')
   * @returns Special skill image URL
   */
  static getSpecialSkillImageUrl(skillName: string, factionId: FactionId): string {
    if (!skillName) {
      throw new Error('Skill name is required');
    }
    if (factionId !== 'cat' && factionId !== 'mouse') {
      throw new Error(`Invalid faction ID: ${factionId}. Expected 'cat' or 'mouse'.`);
    }

    const factionName = this.getFactionDisplayName(factionId);
    return `/images/specialSkills/${skillName}-${factionName}.png`;
  }

  /**
   * Generate card image URL
   * @param cardId - The card ID
   * @param factionId - The faction ('cat' or 'mouse')
   * @returns Card image URL
   */
  static getCardImageUrl(cardId: string, factionId: FactionId): string {
    if (!cardId) {
      throw new Error('Card ID is required');
    }
    if (factionId !== 'cat' && factionId !== 'mouse') {
      throw new Error(`Invalid faction ID: ${factionId}. Expected 'cat' or 'mouse'.`);
    }

    return `/images/${factionId}Cards/${cardId}.png`;
  }

  /**
   * Add image URLs to character skills (batch processing)
   * @param characterName - The character's name
   * @param skills - Array of skills
   * @param factionId - The faction ('cat' or 'mouse')
   * @returns Skills array with image URLs added
   */
  static addSkillImageUrls(characterName: string, skills: Skill[], factionId: FactionId): Skill[] {
    if (!Array.isArray(skills)) {
      throw new Error('Skills must be an array');
    }

    return skills.map((skill) => ({
      ...skill,
      imageUrl: this.getSkillImageUrl(characterName, skill, factionId),
    }));
  }

  /**
   * Get skill number based on skill type
   * @private
   */
  private static getSkillNumber(skillType: SkillType): string {
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
  }

  /**
   * Get faction display name for Chinese text
   * @private
   */
  private static getFactionDisplayName(factionId: FactionId): string {
    return factionId === 'cat' ? '猫' : '鼠';
  }
}
