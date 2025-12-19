import {
  applyMultipleFilters,
  filterByCostRange,
  filterByFaction,
  filterByRank,
  filterByTextSearch,
} from './filterUtils';

describe('filterUtils', () => {
  describe('filterByRank', () => {
    const mockItems = [
      { rank: 'S', name: 'Item 1' },
      { rank: 'A', name: 'Item 2' },
      { rank: 'B', name: 'Item 3' },
      { rank: 'S', name: 'Item 4' },
    ];

    it('should return all items when no filters selected', () => {
      const result = filterByRank(mockItems, new Set());
      expect(result).toHaveLength(4);
    });

    it('should filter by single rank', () => {
      const result = filterByRank(mockItems, new Set(['S']));
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.rank === 'S')).toBe(true);
    });
  });

  describe('filterByCostRange', () => {
    const mockItems = [
      { cost: 1, name: 'Item 1' },
      { cost: 3, name: 'Item 2' },
      { cost: 5, name: 'Item 3' },
      { cost: 7, name: 'Item 4' },
    ];

    it('should return all items when no range specified', () => {
      const result = filterByCostRange(mockItems);
      expect(result).toHaveLength(4);
    });

    it('should filter by cost range', () => {
      const result = filterByCostRange(mockItems, 2, 5);
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.cost >= 2 && item.cost <= 5)).toBe(true);
    });
  });

  describe('filterByFaction', () => {
    const mockItems = [
      { factionId: 'cat', name: 'Cat Item' },
      { factionId: 'mouse', name: 'Mouse Item' },
      { factionId: 'cat', name: 'Another Cat Item' },
    ];

    it('should filter by faction', () => {
      const result = filterByFaction(mockItems, 'cat');
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.factionId === 'cat')).toBe(true);
    });
  });

  describe('filterByTextSearch', () => {
    const mockItems = [
      { name: 'Apple Juice', description: 'Fresh apple drink' },
      { name: 'Orange Soda', description: 'Fizzy orange beverage' },
      { name: 'Apple Pie', description: 'Sweet dessert' },
    ];

    it('should filter by name search', () => {
      const result = filterByTextSearch(mockItems, 'apple', ['name']);
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.name.toLowerCase().includes('apple'))).toBe(true);
    });

    it('should filter by description search', () => {
      const result = filterByTextSearch(mockItems, 'fizzy', ['description']);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Orange Soda');
    });
  });

  describe('applyMultipleFilters', () => {
    const mockItems = [
      { rank: 'S', cost: 5, factionId: 'cat', name: 'Cat S Card', description: 'Strong cat card' },
      { rank: 'A', cost: 3, factionId: 'cat', name: 'Cat A Card', description: 'Good cat card' },
      {
        rank: 'S',
        cost: 4,
        factionId: 'mouse',
        name: 'Mouse S Card',
        description: 'Strong mouse card',
      },
    ];

    it('should apply multiple filters correctly', () => {
      const rankFilter = (item: (typeof mockItems)[0]) => item.rank === 'S';
      const factionFilter = (item: (typeof mockItems)[0]) => item.factionId === 'cat';

      const result = applyMultipleFilters(mockItems, [rankFilter, factionFilter]);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Cat S Card');
    });
  });
});
