import { formatArticleDate, formatCompactDateTime } from './dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 4, 12, 10, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('formatCompactDateTime', () => {
    it('omits the year for current-year dates', () => {
      expect(formatCompactDateTime(new Date(2026, 4, 10, 14, 49))).toBe('05-10 14:49');
    });

    it('keeps the year for dates outside the current year', () => {
      expect(formatCompactDateTime(new Date(2025, 4, 10, 14, 49))).toBe('2025-05-10 14:49');
    });

    it('returns the configured fallback for invalid dates', () => {
      expect(formatCompactDateTime('not-a-date', { invalidFallback: 'invalid' })).toBe('invalid');
    });
  });

  describe('formatArticleDate', () => {
    it('uses relative labels for recent dates', () => {
      expect(formatArticleDate(new Date(2026, 4, 12, 8, 30))).toBe('今天 08:30');
      expect(formatArticleDate(new Date(2026, 4, 11, 8, 30))).toBe('昨天 08:30');
      expect(formatArticleDate(new Date(2026, 4, 10, 8, 30))).toBe('前天 08:30');
    });

    it('uses compact month-day style for older current-year dates', () => {
      expect(formatArticleDate(new Date(2026, 3, 9, 8, 30))).toBe('04-09 08:30');
    });
  });
});
