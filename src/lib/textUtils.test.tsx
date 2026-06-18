import { toChineseNumeral } from './textUtils';

describe('textUtils', () => {
  describe('toChineseNumeral', () => {
    it('formats single digits', () => {
      expect(toChineseNumeral(0)).toBe('零');
      expect(toChineseNumeral(8)).toBe('八');
    });

    it('formats numbers below 20', () => {
      expect(toChineseNumeral(10)).toBe('十');
      expect(toChineseNumeral(16)).toBe('十六');
    });

    it('formats two-digit tens', () => {
      expect(toChineseNumeral(20)).toBe('二十');
      expect(toChineseNumeral(34)).toBe('三十四');
    });

    it('falls back to decimal text for unsupported larger numbers', () => {
      expect(toChineseNumeral(100)).toBe('100');
    });
  });
});
