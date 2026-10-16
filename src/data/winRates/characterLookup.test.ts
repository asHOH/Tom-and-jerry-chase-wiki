import { winRatesData } from '@/data/winRates';
import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';

import { buildWinRateCharacterLookup, normalizeWinRateCharacterName } from './characterLookup';
import { normalizeWinRateRows } from './normalize';

describe('win rate character lookup', () => {
  const characters = [
    ...Object.values(catCharactersWithImages),
    ...Object.values(mouseCharactersWithImages),
  ];
  const lookup = buildWinRateCharacterLookup(characters);

  it.each(['表演者▪杰瑞', '表演者·杰瑞', '表演者杰瑞', '表演者•杰瑞'])(
    'resolves %s to the canonical character',
    (name) => {
      expect(lookup[normalizeWinRateCharacterName(name)]).toEqual({
        id: '表演者•杰瑞',
        factionId: 'mouse',
      });
    }
  );

  it.each(winRatesData)(
    'validates character mappings and row identities for $timeRange',
    (season) => {
      const rows = normalizeWinRateRows(season, lookup);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.filter((row) => row.characterId === null)).toEqual([]);
      for (const row of rows) {
        expect(row.faction).toBe(characters.find(({ id }) => id === row.characterId)?.factionId);
      }
      const rowKeys = rows.map((row) => `${row.rank}-${row.faction}-${row.character}`);
      expect(new Set(rowKeys).size).toBe(rows.length);
      const summaryKeys = (season.winRateSummary ?? []).map((row) => `${row.rank}-${row.teamType}`);
      expect(new Set(summaryKeys).size).toBe(summaryKeys.length);
    }
  );

  it('gives canonical names precedence over aliases', () => {
    const result = buildWinRateCharacterLookup([
      { id: '杰瑞', factionId: 'mouse' },
      { id: '汤姆', factionId: 'cat', aliases: ['杰瑞'] },
    ]);
    expect(result['杰瑞']).toEqual({ id: '杰瑞', factionId: 'mouse' });
    expect(result['未知角色']).toBeUndefined();
  });
});
