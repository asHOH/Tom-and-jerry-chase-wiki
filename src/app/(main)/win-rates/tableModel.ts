import { FACTION_NAMES } from '@/constants/factions';
import type { FactionId } from '@/data/types';
import { getRankLabel, getRankOrder, type WinRateRow } from '@/data/winRates/normalize';
import type { WinRatesEntry } from '@/data/winRates/types';

export type ColumnKey = 'rank' | 'faction' | 'character' | 'pickRate' | 'winRate' | 'banRate';
export type SortColumn = 'pickRateNum' | 'winRateNum' | 'banRateNum';
export type SortDirection = 'asc' | 'desc';
export type DisplayRow = WinRateRow & { no: number; groupStart: boolean };

const USAGE_RATE_ANCHORS = {
  pick: [0, 2, 4, 8, 14, 28],
  ban: [0, 1.5, 3, 8, 28, 60],
} as const;

export function getUsageRateColor(rate: number | null, metric: 'pick' | 'ban'): string | undefined {
  if (rate === null) return undefined;
  const anchors = USAGE_RATE_ANCHORS[metric];
  for (let index = 1; index < anchors.length; index++) {
    const start = anchors[index - 1]!;
    const end = anchors[index]!;
    if (rate <= end) {
      const weight = ((Math.max(0, rate) - start) / (end - start)) * 100;
      return `color-mix(in oklab, var(--wiki-${metric}-rate-${index - 1}), var(--wiki-${metric}-rate-${index}) ${weight}%)`;
    }
  }
  return `var(--wiki-${metric}-rate-5)`;
}

export function getWinRateColor(rate: number): string {
  const clampedRate = Math.min(72, Math.max(28, rate));
  if (clampedRate <= 35) {
    return `color-mix(in oklab, var(--wiki-win-rate-lowest), var(--wiki-win-rate-low) ${((clampedRate - 28) / 7) * 100}%)`;
  }
  if (clampedRate <= 50) {
    return `color-mix(in oklab, var(--wiki-win-rate-low), var(--wiki-win-rate-mid) ${((clampedRate - 35) / 15) * 100}%)`;
  }
  if (clampedRate <= 65) {
    return `color-mix(in oklab, var(--wiki-win-rate-mid), var(--wiki-win-rate-high) ${((clampedRate - 50) / 15) * 100}%)`;
  }
  return `color-mix(in oklab, var(--wiki-win-rate-high), var(--wiki-win-rate-highest) ${((clampedRate - 65) / 7) * 100}%)`;
}

type WinRateColumn = {
  key: ColumnKey;
  label: string;
  widthClassName?: string;
  sortKey?: SortColumn;
  getValue: (row: WinRateRow) => string | null;
};

export const WIN_RATE_COLUMNS: readonly WinRateColumn[] = [
  {
    key: 'rank',
    label: '段位',
    widthClassName: 'w-24 sm:w-28 lg:w-44',
    getValue: (row) => getRankLabel(row.rank, row.faction),
  },
  {
    key: 'faction',
    label: '阵营',
    widthClassName: 'w-11 sm:w-14 lg:w-20',
    getValue: (row) => FACTION_NAMES[row.faction],
  },
  {
    key: 'character',
    label: '角色',
    widthClassName: 'w-28 sm:w-32 lg:w-auto',
    getValue: (row) => row.character,
  },
  { key: 'pickRate', label: '登场率', sortKey: 'pickRateNum', getValue: (row) => row.pickRate },
  { key: 'winRate', label: '胜率', sortKey: 'winRateNum', getValue: (row) => row.winRate },
  { key: 'banRate', label: '禁用率', sortKey: 'banRateNum', getValue: (row) => row.banRate },
];

export function getWinRateDisplayRows(
  rows: readonly WinRateRow[],
  {
    ranks,
    factions,
    sortColumn,
    sortDirection,
  }: {
    ranks: ReadonlySet<string>;
    factions: ReadonlySet<FactionId>;
    sortColumn: SortColumn;
    sortDirection: SortDirection;
  }
): DisplayRow[] {
  const sorted = rows
    .filter(
      (row) =>
        (ranks.size === 0 || ranks.has(row.rank)) &&
        (factions.size === 0 || factions.has(row.faction))
    )
    .sort((a, b) => {
      const rankCompare = getRankOrder(a.rank) - getRankOrder(b.rank);
      if (rankCompare !== 0) return rankCompare;
      if (a.faction !== b.faction) return a.faction === 'mouse' ? -1 : 1;

      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === null) return bValue === null ? 0 : 1;
      if (bValue === null) return -1;
      return (aValue - bValue) * (sortDirection === 'asc' ? 1 : -1);
    });

  let no = 0;
  return sorted.map((row, index) => {
    const previous = sorted[index - 1];
    const groupStart = !previous || previous.rank !== row.rank || previous.faction !== row.faction;
    no = groupStart ? 1 : no + 1;
    return { ...row, no, groupStart };
  });
}

function escapeCsvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toWinRatesCsv(
  rows: readonly DisplayRow[],
  columns: readonly WinRateColumn[]
): string {
  return toCsv([
    ['No.', ...columns.map((column) => column.label)],
    ...rows.map((row) => [row.no, ...columns.map((column) => column.getValue(row))]),
  ]);
}

export function toWinRateSummaryCsv(rows: NonNullable<WinRatesEntry['winRateSummary']>): string {
  const showPercent = rows.some((row) => row.percent);
  return toCsv([
    ['段位', '组队类型', '猫胜率', '鼠胜率', ...(showPercent ? ['占比'] : [])],
    ...rows.map((row) => [
      getRankLabel(row.rank),
      row.teamType,
      row.catWin,
      row.mouseWin,
      ...(showPercent ? [row.percent ?? null] : []),
    ]),
  ]);
}

function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
}

export function sanitizeFileName(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}
