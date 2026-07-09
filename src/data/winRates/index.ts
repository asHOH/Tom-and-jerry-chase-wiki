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

/**
 * Transform rank name based on faction
 */
function transformRankByFaction(rank: string, factionId: 'cat' | 'mouse'): string {
  const faction = factionId === 'cat' ? '猫' : '鼠';

  if (rank === '无敌猫鼠皇') {
    return `无敌${faction}皇`;
  }

  if (rank === '皇2000分以上') {
    return `${faction}皇2000分以上`;
  }

  if (rank === '皇0分-皇2000分') {
    return `${faction}皇0分-${faction}皇2000分`;
  }

  return rank;
}

export function getCharacterWinRates(
  characterNames: string[],
  factionId?: 'cat' | 'mouse'
): CharacterWinRateEntry[] {
  const results: CharacterWinRateEntry[] = [];

  for (const entry of winRatesData) {
    const timeRange = entry.timeRange;

    const allTables = [...(entry.tables || []), ...(entry.characterTables || [])];

    for (const table of allTables) {
      if ('rows' in table && table.rows.length > 0) {
        const firstRow = table.rows[0];
        if (firstRow && 'character' in firstRow) {
          const charTable = table as CharacterTable;
          for (const row of charTable.rows) {
            if (characterNames.includes(row.character)) {
              const rank = factionId
                ? transformRankByFaction(charTable.rank, factionId)
                : charTable.rank;

              results.push({
                timeRange,
                rank,
                ...(charTable.faction && { faction: charTable.faction }),
                pickRate: row.pickRate,
                winRate: row.winRate,
                ...(row.banRate && { banRate: row.banRate }),
              });
            }
          }
        }
      }
    }
  }

  return results;
}

export type { CharacterTable, WinRatesEntry, CharacterWinRateEntry };
