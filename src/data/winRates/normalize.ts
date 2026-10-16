import type { FactionId } from '@/data/types';

import { normalizeWinRateCharacterName, type WinRateCharacterLookup } from './characterLookup';
import type { CharacterTable, WinRatesEntry } from './types';

export type WinRateRow = {
  rank: string;
  character: string;
  characterId: string | null;
  faction: FactionId;
  sourceFaction: CharacterTable['faction'];
  pickRate: string;
  winRate: string;
  banRate: string | null;
  pickRateNum: number;
  winRateNum: number;
  banRateNum: number | null;
};

const RANK_ORDER: readonly string[] = [
  '全部',
  '无敌猫鼠皇',
  '皇2000分以上',
  '皇0分-皇2000分',
  '至尊传奇',
  '霸气钻石',
  '酷炫铂金',
  '机智黄金',
  '顽皮白银',
  '呆萌青铜',
];

export function getRankOrder(rank: string): number {
  const index = RANK_ORDER.indexOf(rank);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function getRankLabel(rank: string, factionId?: FactionId): string {
  if (rank === '全部') return '全段位';
  if (!factionId) return rank;
  const faction = factionId === 'cat' ? '猫' : '鼠';
  if (rank === '无敌猫鼠皇') return `无敌${faction}皇`;
  if (rank === '皇2000分以上') return `${faction}皇2000分以上`;
  if (rank === '皇0分-皇2000分') return `${faction}皇0分-${faction}皇2000分`;
  return rank;
}

export function getCharacterTables(entry: WinRatesEntry): CharacterTable[] {
  return [
    ...(entry.characterTables ?? []),
    ...(entry.tables ?? []).filter(
      (table): table is CharacterTable => table.rows.length > 0 && 'character' in table.rows[0]!
    ),
  ];
}

export function getWinRateRanks(entry: WinRatesEntry): string[] {
  const tables = [...(entry.characterTables ?? []), ...(entry.tables ?? [])];
  return [...new Set(tables.map((table) => table.rank))].sort(
    (a, b) => getRankOrder(a) - getRankOrder(b)
  );
}

export function normalizeWinRateRows(
  entry: WinRatesEntry,
  characterLookup: WinRateCharacterLookup
): WinRateRow[] {
  return getCharacterTables(entry).flatMap((table) =>
    table.rows.map((row) => {
      const character = characterLookup[normalizeWinRateCharacterName(row.character)];
      const faction =
        character?.factionId ??
        (table.faction === '猫' ? 'cat' : table.faction === '鼠' ? 'mouse' : undefined);
      if (!faction) {
        throw new Error(
          `Cannot resolve win-rate faction: ${entry.timeRange} / ${table.rank} / ${row.character}`
        );
      }
      return {
        rank: table.rank,
        character: row.character,
        characterId: character?.id ?? null,
        faction,
        sourceFaction: table.faction,
        pickRate: row.pickRate,
        winRate: row.winRate,
        banRate: row.banRate ?? null,
        pickRateNum: parseFloat(row.pickRate),
        winRateNum: parseFloat(row.winRate),
        banRateNum: row.banRate === undefined ? null : parseFloat(row.banRate),
      };
    })
  );
}
