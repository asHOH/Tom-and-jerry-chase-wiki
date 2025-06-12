import {
  RANK_ORDER,
  sortCardsByRank,
  sortCardsByCost,
  sortCharactersByName,
  sortByMultipleCriteria,
  createRankComparator,
  createCostComparator,
  createNameComparator,
} from '../sortingUtils';

describe('sortingUtils', () => {
  describe('RANK_ORDER', () => {
    it('should have correct rank order values', () => {
      expect(RANK_ORDER.S).toBe(4);
      expect(RANK_ORDER.A).toBe(3);
      expect(RANK_ORDER.B).toBe(2);
      expect(RANK_ORDER.C).toBe(1);
    });
  });

  describe('sortCardsByRank', () => {
    const mockCards = [
      { rank: 'B', cost: 3, name: 'Card B3' },
      { rank: 'S', cost: 5, name: 'Card S5' },
      { rank: 'A', cost: 2, name: 'Card A2' },
      { rank: 'S', cost: 3, name: 'Card S3' },
      { rank: 'C', cost: 1, name: 'Card C1' },
    ];

    it('should sort by rank first (S > A > B > C)', () => {
      const result = sortCardsByRank(mockCards);
      expect(result[0].rank).toBe('S');
      expect(result[1].rank).toBe('S');
      expect(result[2].rank).toBe('A');
      expect(result[3].rank).toBe('B');
      expect(result[4].rank).toBe('C');
    });

    it('should sort by cost within same rank (highest first)', () => {
      const result = sortCardsByRank(mockCards);
      const sRankCards = result.filter(card => card.rank === 'S');
      expect(sRankCards[0].cost).toBe(5);
      expect(sRankCards[1].cost).toBe(3);
    });

    it('should not mutate original array', () => {
      const original = [...mockCards];
      sortCardsByRank(mockCards);
      expect(mockCards).toEqual(original);
    });
  });

  describe('sortCardsByCost', () => {
    const mockCards = [
      { cost: 2, name: 'Card 2' },
      { cost: 5, name: 'Card 5' },
      { cost: 1, name: 'Card 1' },
      { cost: 3, name: 'Card 3' },
    ];

    it('should sort by cost in descending order', () => {
      const result = sortCardsByCost(mockCards);
      expect(result.map(card => card.cost)).toEqual([5, 3, 2, 1]);
    });

    it('should not mutate original array', () => {
      const original = [...mockCards];
      sortCardsByCost(mockCards);
      expect(mockCards).toEqual(original);
    });
  });

  describe('sortCharactersByName', () => {
    const mockCharacters = [
      { name: '汤姆' },
      { name: '杰瑞' },
      { name: '布奇' },
      { name: '泰菲' },
    ];    it('should sort characters alphabetically by name', () => {
      const result = sortCharactersByName(mockCharacters);
      const names = result.map(char => char.name);
      expect(names).toEqual(['布奇', '杰瑞', '泰菲', '汤姆']);
    });

    it('should not mutate original array', () => {
      const original = [...mockCharacters];
      sortCharactersByName(mockCharacters);
      expect(mockCharacters).toEqual(original);
    });
  });

  describe('sortByMultipleCriteria', () => {
    const mockItems = [
      { rank: 'A', cost: 3, name: 'Item A3' },
      { rank: 'S', cost: 2, name: 'Item S2' },
      { rank: 'A', cost: 5, name: 'Item A5' },
      { rank: 'S', cost: 2, name: 'Item S2b' },
    ];

    it('should apply multiple comparators in order', () => {
      const comparators = [
        createRankComparator<typeof mockItems[0]>(),
        createCostComparator<typeof mockItems[0]>(false), // descending
      ];
      
      const result = sortByMultipleCriteria(mockItems, comparators);
      
      // Should be sorted by rank first (S > A), then by cost (higher first)
      expect(result[0]).toEqual({ rank: 'S', cost: 2, name: 'Item S2' });
      expect(result[1]).toEqual({ rank: 'S', cost: 2, name: 'Item S2b' });
      expect(result[2]).toEqual({ rank: 'A', cost: 5, name: 'Item A5' });
      expect(result[3]).toEqual({ rank: 'A', cost: 3, name: 'Item A3' });
    });
  });

  describe('createRankComparator', () => {
    const mockItems = [
      { rank: 'B', name: 'Item B' },
      { rank: 'S', name: 'Item S' },
      { rank: 'A', name: 'Item A' },
    ];

    it('should create rank comparator function', () => {
      const comparator = createRankComparator<typeof mockItems[0]>();
      const result = [...mockItems].sort(comparator);
      expect(result.map(item => item.rank)).toEqual(['S', 'A', 'B']);
    });
  });

  describe('createCostComparator', () => {
    const mockItems = [
      { cost: 3, name: 'Item 3' },
      { cost: 1, name: 'Item 1' },
      { cost: 5, name: 'Item 5' },
    ];

    it('should create descending cost comparator by default', () => {
      const comparator = createCostComparator<typeof mockItems[0]>();
      const result = [...mockItems].sort(comparator);
      expect(result.map(item => item.cost)).toEqual([5, 3, 1]);
    });

    it('should create ascending cost comparator when specified', () => {
      const comparator = createCostComparator<typeof mockItems[0]>(true);
      const result = [...mockItems].sort(comparator);
      expect(result.map(item => item.cost)).toEqual([1, 3, 5]);
    });
  });

  describe('createNameComparator', () => {
    const mockItems = [
      { name: '汤姆' },
      { name: '杰瑞' },
      { name: '布奇' },
    ];

    it('should create ascending name comparator by default', () => {
      const comparator = createNameComparator<typeof mockItems[0]>();
      const result = [...mockItems].sort(comparator);
      expect(result.map(item => item.name)).toEqual(['布奇', '杰瑞', '汤姆']);
    });

    it('should create descending name comparator when specified', () => {
      const comparator = createNameComparator<typeof mockItems[0]>(false);
      const result = [...mockItems].sort(comparator);
      expect(result.map(item => item.name)).toEqual(['汤姆', '杰瑞', '布奇']);
    });
  });
});
