import { sortCardsByRank, sortCardsByCost, sortCharactersByName } from '../sortingUtils';

describe('sortingUtils', () => {
  describe('sortCardsByRank', () => {
    const mockCards = [
      { rank: 'B', cost: 3, name: 'Card B3' },
      { rank: 'S', cost: 5, name: 'Card S5' },
      { rank: 'A', cost: 2, name: 'Card A2' },
      { rank: 'C', cost: 1, name: 'Card C1' },
    ];

    it('should sort by rank correctly (S > A > B > C)', () => {
      const result = sortCardsByRank(mockCards);
      expect(result[0]!.rank).toBe('S');
      expect(result[1]!.rank).toBe('A');
      expect(result[2]!.rank).toBe('B');
      expect(result[3]!.rank).toBe('C');
    });
  });

  describe('sortCardsByCost', () => {
    const mockCards = [
      { cost: 3, name: 'Card 3' },
      { cost: 1, name: 'Card 1' },
      { cost: 5, name: 'Card 5' },
    ];

    it('should sort by cost correctly (highest first)', () => {
      const result = sortCardsByCost(mockCards);
      expect(result[0]!.cost).toBe(5);
      expect(result[1]!.cost).toBe(3);
      expect(result[2]!.cost).toBe(1);
    });
  });

  describe('sortCharactersByName', () => {
    const mockCharacters = [{ name: '杰瑞' }, { name: '汤姆' }, { name: '泰菲' }];

    it('should sort characters by name', () => {
      const result = sortCharactersByName(mockCharacters);
      expect(result.map((c) => c.name)).toEqual(['杰瑞', '泰菲', '汤姆']);
    });
  });
});
