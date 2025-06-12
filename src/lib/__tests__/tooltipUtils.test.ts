import {
  getTooltipContent,
  getPositioningTagTooltipContent,
  getItemKeyTooltipContent,
  extractItemKeyActions,
  hasItemKeyPatterns,
  getAvailableProperties,
  getAvailablePositioningTags,
} from '../tooltipUtils';

describe('tooltipUtils', () => {
  describe('getTooltipContent', () => {
    it('should return detailed tooltip when available and requested', () => {
      const result = getTooltipContent('Hp上限', 'cat', true);
      expect(result).toBe('健康值上限，俗称"血条"（盘子的伤害是50）');
    });

    it('should return normal tooltip when detailed not available', () => {
      const result = getTooltipContent('Hp上限', 'cat', false);
      expect(result).toBe('健康值上限，俗称"血条"');
    });

    it('should return mouse-specific tooltip', () => {
      const result = getTooltipContent('推速', 'mouse', true);
      expect(result).toBe('推奶酪速度（前3分钟）');
    });

    it('should fallback to general tooltip when faction-specific not available', () => {
      const result = getTooltipContent('未知属性', 'cat', false);
      expect(result).toBe('未知属性的相关信息');
    });
  });

  describe('getPositioningTagTooltipContent', () => {
    it('should return cat positioning tag tooltip', () => {
      const result = getPositioningTagTooltipContent('进攻', 'cat', false);
      expect(result).toBe('擅长击倒和放飞老鼠');
    });

    it('should return detailed cat positioning tag tooltip', () => {
      const result = getPositioningTagTooltipContent('进攻', 'cat', true);
      expect(result).toBe('擅长击倒和放飞老鼠，通常拥有较高的伤害、控制或上火箭能力');
    });

    it('should return mouse positioning tag tooltip', () => {
      const result = getPositioningTagTooltipContent('奶酪', 'mouse', false);
      expect(result).toBe('擅长推奶酪和搬奶酪');
    });

    it('should return detailed mouse positioning tag tooltip', () => {
      const result = getPositioningTagTooltipContent('奶酪', 'mouse', true);
      expect(result).toBe('擅长推奶酪和搬奶酪，通常推速较高或拥有瞬移技能');
    });

    it('should fallback when tag not found', () => {
      const result = getPositioningTagTooltipContent('未知标签', 'cat', false);
      expect(result).toBe('未知标签定位的相关信息');
    });
  });

  describe('getItemKeyTooltipContent', () => {
    it('should return detailed item key tooltip', () => {
      const result = getItemKeyTooltipContent('打断', true);
      expect(result).toBe('需要手中有道具或【所在处有道具且技能在地面原地释放】时才能打断');
    });

    it('should return simple item key tooltip', () => {
      const result = getItemKeyTooltipContent('取消后摇', false);
      expect(result).toBe('需要手中有道具');
    });
  });

  describe('extractItemKeyActions', () => {
    it('should extract single action from item key pattern', () => {
      const result = extractItemKeyActions('道具键*打断技能释放');
      expect(result).toEqual(['打断技能释放']);
    });    it('should extract multiple actions', () => {
      const result = extractItemKeyActions('道具键*打断（需要道具） or 道具键*取消后摇（需要道具）');
      expect(result).toEqual(['打断', '取消后摇']);
    });

    it('should handle actions with parentheses', () => {
      const result = extractItemKeyActions('道具键*打断（需要道具）');
      expect(result).toEqual(['打断']);
    });

    it('should return empty array when no patterns found', () => {
      const result = extractItemKeyActions('No item key patterns here');
      expect(result).toEqual([]);
    });
  });

  describe('hasItemKeyPatterns', () => {
    it('should detect item key patterns', () => {
      expect(hasItemKeyPatterns('道具键*打断技能')).toBe(true);
      expect(hasItemKeyPatterns('Regular text')).toBe(false);
    });
  });

  describe('getAvailableProperties', () => {
    it('should return cat properties', () => {
      const result = getAvailableProperties('cat');
      expect(result).toContain('Hp上限');
      expect(result).toContain('攻击增伤');
      expect(result).toContain('爪刀CD');
    });

    it('should return mouse properties', () => {
      const result = getAvailableProperties('mouse');
      expect(result).toContain('Hp上限');
      expect(result).toContain('推速');
      expect(result).toContain('墙缝增伤');
    });
  });

  describe('getAvailablePositioningTags', () => {
    it('should return cat positioning tags', () => {
      const result = getAvailablePositioningTags('cat');
      expect(result).toContain('进攻');
      expect(result).toContain('防守');
      expect(result).toContain('追击');
    });

    it('should return mouse positioning tags', () => {
      const result = getAvailablePositioningTags('mouse');
      expect(result).toContain('奶酪');
      expect(result).toContain('干扰');
      expect(result).toContain('救援');
    });
  });
});
