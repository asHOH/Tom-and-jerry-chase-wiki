import {
  validateSkillAllocationPattern,
  parseSkillAllocationPattern,
} from '../skillAllocationUtils';

describe('skillAllocationUtils', () => {
  describe('validateSkillAllocationPattern', () => {
    it('should validate basic patterns', () => {
      expect(validateSkillAllocationPattern('012301')).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
      });
    });

    it('should validate parallel patterns', () => {
      expect(validateSkillAllocationPattern('[12]031')).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
      });
    });

    it('should validate delayed patterns', () => {
      expect(validateSkillAllocationPattern('01(2)301')).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
      });
    });

    it('should validate negative effect patterns', () => {
      expect(validateSkillAllocationPattern('012-301')).toEqual({
        isValid: true,
        errors: [],
        warnings: [],
      });
    });

    it('should reject empty patterns', () => {
      const result = validateSkillAllocationPattern('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toBe('加点方案不能为空');
    });

    it('should reject invalid characters', () => {
      const result = validateSkillAllocationPattern('012a301');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('包含无效字符');
    });

    it('should reject unmatched brackets', () => {
      const result = validateSkillAllocationPattern('[12301');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toBe('存在未闭合的方括号');
    });

    it('should reject odd-length parallel groups', () => {
      const result = validateSkillAllocationPattern('[123]01');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.message).toContain('内容长度必须为偶数');
    });

    it('should reject invalid skill types in parallel groups', () => {
      const result = validateSkillAllocationPattern('[1a]01');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.message).toContain('包含无效字符');
    });

    it('should reject invalid delayed patterns', () => {
      const result = validateSkillAllocationPattern('01(ab)301');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.message).toContain('包含无效字符');
    });

    it('should warn about long patterns', () => {
      const result = validateSkillAllocationPattern('012301230123012301230');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('加点方案较长');
    });

    it('should warn about consecutive negative markers', () => {
      const result = validateSkillAllocationPattern('012--301');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.message).toContain('连续的负面效果标记');
    });
  });

  describe('parseSkillAllocationPattern', () => {
    it('should parse basic patterns', () => {
      const result = parseSkillAllocationPattern('012');
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        skillType: '0',
        isDelayed: false,
        hasNegativeEffect: false,
        isParallel: false,
      });
    });

    it('should parse parallel patterns', () => {
      const result = parseSkillAllocationPattern('[12]');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        skillType: '1',
        isDelayed: false,
        hasNegativeEffect: false,
        isParallel: true,
        parallelOptions: ['1', '2'],
        bracketGroupId: 0,
      });
    });

    it('should parse delayed patterns', () => {
      const result = parseSkillAllocationPattern('(1)');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        skillType: '1',
        isDelayed: true,
        hasNegativeEffect: false,
        isParallel: false,
      });
    });

    it('should parse negative effect patterns', () => {
      const result = parseSkillAllocationPattern('-1');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        skillType: '1',
        isDelayed: false,
        hasNegativeEffect: true,
        isParallel: false,
      });
    });

    it('should throw for invalid patterns', () => {
      expect(() => parseSkillAllocationPattern('invalid')).toThrow();
    });
  });
});
