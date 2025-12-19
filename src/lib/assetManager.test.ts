import type { Skill } from '../data/types';
import { AssetManager } from './assetManager';

describe('AssetManager', () => {
  const mockSkill: Skill = {
    id: 'tom-active',
    name: '发怒冲刺',
    type: 'active',
    description: 'Tom charges forward',
    forecast: 0,
    aftercast: 0,
    skillLevels: [{ level: 1, description: 'Level 1 effect' }],
  };

  const mockPassiveSkill: Skill = {
    id: 'tom-passive',
    name: '被动技能',
    type: 'passive',
    description: 'Passive ability',
    forecast: 0,
    aftercast: 0,
    skillLevels: [{ level: 1, description: 'Always active' }],
  };

  const mockWeapon1Skill: Skill = {
    id: 'tom-weapon1',
    name: '手型枪',
    type: 'weapon1',
    description: 'Weapon 1 skill',
    forecast: 0,
    aftercast: 0,
    skillLevels: [{ level: 1, description: 'Ranged attack' }],
  };

  const mockWeapon2Skill: Skill = {
    id: 'tom-weapon2',
    name: '平底锅',
    type: 'weapon2',
    description: 'Weapon 2 skill',
    forecast: 0,
    aftercast: 0,
    skillLevels: [{ level: 1, description: 'Melee attack' }],
  };

  describe('getSkillImageUrl', () => {
    it('should generate correct URL for active skill', () => {
      const url = AssetManager.getSkillImageUrl('汤姆', mockSkill, 'cat');
      expect(url).toBe('/images/catSkills/汤姆1-发怒冲刺.png');
    });

    it('should generate correct URL for weapon1 skill', () => {
      const url = AssetManager.getSkillImageUrl('汤姆', mockWeapon1Skill, 'cat');
      expect(url).toBe('/images/catSkills/汤姆2-手型枪.png');
    });

    it('should generate correct URL for weapon2 skill', () => {
      const url = AssetManager.getSkillImageUrl('汤姆', mockWeapon2Skill, 'cat');
      expect(url).toBe('/images/catSkills/汤姆3-平底锅.png');
    });

    it('should generate correct URL for passive skill (cat)', () => {
      const url = AssetManager.getSkillImageUrl('汤姆', mockPassiveSkill, 'cat');
      expect(url).toBe('/images/catSkills/被动-猫.png');
    });

    it('should generate correct URL for passive skill (mouse)', () => {
      const url = AssetManager.getSkillImageUrl('杰瑞', mockPassiveSkill, 'mouse');
      expect(url).toBe('/images/mouseSkills/被动-鼠.png');
    });

    it('should handle mouse faction correctly', () => {
      const url = AssetManager.getSkillImageUrl('杰瑞', mockSkill, 'mouse');
      expect(url).toBe('/images/mouseSkills/杰瑞1-发怒冲刺.png');
    });
  });

  describe('addSkillImageUrls', () => {
    const mockSkills: Skill[] = [mockSkill, mockWeapon1Skill, mockPassiveSkill];

    it('should add imageUrl to all skills', () => {
      const result = AssetManager.addSkillImageUrls('汤姆', mockSkills, 'cat');

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        ...mockSkill,
        imageUrl: '/images/catSkills/汤姆1-发怒冲刺.png',
      });
      expect(result[1]).toEqual({
        ...mockWeapon1Skill,
        imageUrl: '/images/catSkills/汤姆2-手型枪.png',
      });
      expect(result[2]).toEqual({
        ...mockPassiveSkill,
        imageUrl: '/images/catSkills/被动-猫.png',
      });
    });

    it('should not mutate original skills array', () => {
      const originalSkills = [...mockSkills];
      AssetManager.addSkillImageUrls('汤姆', mockSkills, 'cat');
      expect(mockSkills).toEqual(originalSkills);
    });

    it('should handle empty skills array', () => {
      const result = AssetManager.addSkillImageUrls('汤姆', [], 'cat');
      expect(result).toEqual([]);
    });

    it('should work with mouse faction', () => {
      const result = AssetManager.addSkillImageUrls('杰瑞', [mockSkill], 'mouse');
      expect(result[0]!.imageUrl).toBe('/images/mouseSkills/杰瑞1-发怒冲刺.png');
    });
  });
});
