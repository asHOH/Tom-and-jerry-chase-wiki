import { winRatesData } from '@/data/winRates';
import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';

import { buildWinRateCharacterLookup, normalizeWinRateCharacterName } from './characterLookup';

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

  it('resolves every historical name in the checked-in datasets', () => {
    for (const season of winRatesData) {
      for (const table of [...(season.tables ?? []), ...(season.characterTables ?? [])]) {
        for (const row of table.rows) {
          if ('character' in row) {
            const character = lookup[normalizeWinRateCharacterName(row.character)];
            expect(character).toBeDefined();
            expect(characters.find(({ id }) => id === character?.id)?.factionId).toBe(
              character?.factionId
            );
          }
        }
      }
    }
  });

  it('gives canonical names precedence over aliases', () => {
    const result = buildWinRateCharacterLookup([
      { id: '杰瑞', factionId: 'mouse' },
      { id: '汤姆', factionId: 'cat', aliases: ['杰瑞'] },
    ]);
    expect(result['杰瑞']).toEqual({ id: '杰瑞', factionId: 'mouse' });
    expect(result['未知角色']).toBeUndefined();
  });
});
