import { getPositioningTagTooltipContent, getTooltipContent } from './tooltipUtils';

describe('tooltipUtils', () => {
  describe('getTooltipContent', () => {
    it('should return detailed tooltip when available and requested', () => {
      const result = getTooltipContent('Hp上限', 'cat', true);
      expect(result).toBe('健康值上限（盘子的伤害是50；Hp<0时虚弱）');
    });

    it('should return normal tooltip when detailed not available', () => {
      const result = getTooltipContent('Hp上限', 'cat', false);
      expect(result).not.toBe('Hp上限的相关信息');
      expect(result).toContain('血条');
    });

    it('should return mouse-specific tooltip', () => {
      const result = getTooltipContent('推速', 'mouse', true);
      expect(result).toContain('推奶酪速度');
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
      const normalResult = getPositioningTagTooltipContent('奶酪', 'mouse', false);
      expect(result).not.toBe(`${'奶酪'}定位的相关信息`);
      expect(result).not.toBe(normalResult);
      expect(result).toContain('奶酪');
    });

    it('should fallback when tag not found', () => {
      const result = getPositioningTagTooltipContent('未知标签', 'cat', false);
      expect(result).toBe('未知标签定位的相关信息');
    });
  });
});
