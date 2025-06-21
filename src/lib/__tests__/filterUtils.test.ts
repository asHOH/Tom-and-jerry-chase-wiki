import {
  useFilterState,
  filterByRank,
  filterByCostRange,
  filterByFaction,
  filterByTextSearch,
  applyMultipleFilters,
  createRankFilter,
  createCostFilter,
  RANK_OPTIONS,
} from '../filterUtils';
import { renderHook, act } from '@testing-library/react';

describe('filterUtils', () => {
  describe('useFilterState', () => {
    it('should initialize with empty filters by default', () => {
      const { result } = renderHook(() => useFilterState<string>());

      expect(result.current.selectedFilters.size).toBe(0);
      expect(result.current.hasAnyFilters).toBe(false);
    });

    it('should initialize with provided filters', () => {
      const initialFilters = new Set(['A', 'B']);
      const { result } = renderHook(() => useFilterState(initialFilters));

      expect(result.current.selectedFilters.size).toBe(2);
      expect(result.current.hasFilter('A')).toBe(true);
      expect(result.current.hasFilter('B')).toBe(true);
      expect(result.current.hasAnyFilters).toBe(true);
    });

    it('should toggle filters correctly', () => {
      const { result } = renderHook(() => useFilterState<string>());

      act(() => {
        result.current.toggleFilter('A');
      });

      expect(result.current.hasFilter('A')).toBe(true);

      act(() => {
        result.current.toggleFilter('A');
      });

      expect(result.current.hasFilter('A')).toBe(false);
    });

    it('should clear all filters', () => {
      const initialFilters = new Set(['A', 'B']);
      const { result } = renderHook(() => useFilterState(initialFilters));

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.selectedFilters.size).toBe(0);
      expect(result.current.hasAnyFilters).toBe(false);
    });
  });

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

    it('should filter by multiple ranks', () => {
      const result = filterByRank(mockItems, new Set(['S', 'A']));
      expect(result).toHaveLength(3);
      expect(result.every((item) => ['S', 'A'].includes(item.rank))).toBe(true);
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

    it('should filter by minimum cost', () => {
      const result = filterByCostRange(mockItems, 3);
      expect(result).toHaveLength(3);
      expect(result.every((item) => item.cost >= 3)).toBe(true);
    });

    it('should filter by maximum cost', () => {
      const result = filterByCostRange(mockItems, undefined, 5);
      expect(result).toHaveLength(3);
      expect(result.every((item) => item.cost <= 5)).toBe(true);
    });

    it('should filter by cost range', () => {
      const result = filterByCostRange(mockItems, 3, 5);
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.cost >= 3 && item.cost <= 5)).toBe(true);
    });
  });

  describe('filterByFaction', () => {
    const mockItems = [
      { factionId: 'cat', name: 'Cat Item 1' },
      { factionId: 'mouse', name: 'Mouse Item 1' },
      { factionId: 'cat', name: 'Cat Item 2' },
    ];

    it('should filter by faction', () => {
      const result = filterByFaction(mockItems, 'cat');
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.factionId === 'cat')).toBe(true);
    });
  });

  describe('filterByTextSearch', () => {
    const mockItems = [
      { name: 'Tom Cat', description: 'A house cat' },
      { name: 'Jerry Mouse', description: 'A clever mouse' },
      { name: 'Spike Dog', description: 'A bulldog' },
    ];

    it('should return all items when search text is empty', () => {
      const result = filterByTextSearch(mockItems, '', ['name', 'description']);
      expect(result).toHaveLength(3);
    });

    it('should filter by name field', () => {
      const result = filterByTextSearch(mockItems, 'Tom', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Tom Cat');
    });

    it('should filter by multiple fields', () => {
      const result = filterByTextSearch(mockItems, 'cat', ['name', 'description']);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Tom Cat');
    });

    it('should be case insensitive', () => {
      const result = filterByTextSearch(mockItems, 'MOUSE', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Jerry Mouse');
    });

    it('should filter by text field', () => {
      const result = filterByTextSearch(mockItems, 'Tom', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Tom Cat');
    });
  });

  describe('applyMultipleFilters', () => {
    const mockItems = [
      { rank: 'S', cost: 5, name: 'Item 1' },
      { rank: 'A', cost: 3, name: 'Item 2' },
      { rank: 'S', cost: 2, name: 'Item 3' },
    ];

    it('should apply multiple filters', () => {
      const filters = [
        (item: (typeof mockItems)[0]) => item.rank === 'S',
        (item: (typeof mockItems)[0]) => item.cost >= 3,
      ];

      const result = applyMultipleFilters(mockItems, filters);
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Item 1');
    });
  });

  describe('createRankFilter', () => {
    const mockItems = [
      { rank: 'S', name: 'Item 1' },
      { rank: 'A', name: 'Item 2' },
    ];

    it('should create rank filter function', () => {
      const filter = createRankFilter(new Set(['S']));
      const result = mockItems.filter(filter);
      expect(result).toHaveLength(1);
      expect(result[0]!.rank).toBe('S');
    });
  });

  describe('createCostFilter', () => {
    const mockItems = [
      { cost: 1, name: 'Item 1' },
      { cost: 5, name: 'Item 2' },
    ];

    it('should create cost filter function', () => {
      const filter = createCostFilter(3, 6);
      const result = mockItems.filter(filter);
      expect(result).toHaveLength(1);
      expect(result[0]!.cost).toBe(5);
    });
  });

  describe('constants', () => {
    it('should export RANK_OPTIONS', () => {
      expect(RANK_OPTIONS).toEqual(['S', 'A', 'B', 'C']);
    });
  });
});
