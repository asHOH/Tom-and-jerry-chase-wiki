import { normalizeWinRateCharacterName } from './characterLookup';
import { getCharacterTables, getRankLabel } from './normalize';
import s24Data from './s24';
import s25Data from './s25';
import s26Data from './s26';
import s26Data2 from './s26-2';
import s27Data from './s27';
import s28Data from './s28';
import { CharacterTable, CharacterWinRateEntry, WinRatesEntry } from './types';

export const winRatesData: WinRatesEntry[] = [
  s28Data,
  s27Data,
  s26Data2,
  s26Data,
  s25Data,
  s24Data,
];

export function getCharacterWinRates(
  characterNames: string[],
  factionId?: 'cat' | 'mouse'
): CharacterWinRateEntry[] {
  const results: CharacterWinRateEntry[] = [];
  const [id] = characterNames;
  if (!id) return results;
  const names = new Set(characterNames.map(normalizeWinRateCharacterName));

  for (const entry of winRatesData) {
    for (const table of getCharacterTables(entry)) {
      for (const row of table.rows) {
        if (!names.has(normalizeWinRateCharacterName(row.character))) continue;
        results.push({
          timeRange: entry.timeRange,
          rank: getRankLabel(table.rank, factionId),
          ...(table.faction && { faction: table.faction }),
          pickRate: row.pickRate,
          winRate: row.winRate,
          ...(row.banRate !== undefined && { banRate: row.banRate }),
        });
      }
    }
  }

  return results;
}

export type { CharacterTable, WinRatesEntry, CharacterWinRateEntry };
