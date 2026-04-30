'use client';

import { useMemo, useState } from 'react';

import { cn, getFactionButtonColors } from '@/lib/design';
import { useFilterState } from '@/lib/filterUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data/types';
import { CharacterTable, summarySymbol, winRatesData } from '@/data/winRates';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Link from '@/components/Link';
import { characters } from '@/data';

type ColumnKey = 'rank' | 'faction' | 'character' | 'pickRate' | 'winRate' | 'banRate';
type SortColumn = 'pickRate' | 'winRate' | 'banRate';
type SortDirection = 'asc' | 'desc';

interface EnrichedCharacterRow {
  rank: string;
  rankOrder: number;
  character: string;
  faction: FactionId;
  pickRate: string;
  winRate: string;
  banRate: string;
  pickRateNum: number;
  winRateNum: number;
  banRateNum: number;
}

interface WinRatesClientProps {
  description: string;
}

function escapeCsvCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  const mustQuote = /[",\n\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return mustQuote ? `"${escaped}"` : escaped;
}

function toCsv(rows: Array<Record<string, unknown>>, header: string[]): string {
  const lines: string[] = [];
  lines.push(header.map(escapeCsvCell).join(','));
  for (const row of rows) {
    lines.push(header.map((key) => escapeCsvCell(row[key])).join(','));
  }
  return lines.join('\n');
}

function sanitizeFileName(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRate(rate: string | undefined): number {
  if (!rate) return 0;
  return parseFloat(rate.replace('%', ''));
}

const RANK_ORDER: readonly string[] = [
  '无敌猫鼠皇',
  '皇2000分以上',
  '皇0分-皇2000分',
  '至尊传奇',
  '霸气钻石',
  '酷炫铂金',
];

const FACTION_ORDER_VALUE: Readonly<Record<FactionId, number>> = {
  mouse: 0,
  cat: 1,
};

type DisplayRow = EnrichedCharacterRow & { no: number; groupStart: boolean };

function getRankOrder(rank: string): number {
  const idx = RANK_ORDER.indexOf(rank);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

function getFactionIdFromCharacters(characterName: string): FactionId | null {
  const factionId = characters[characterName]?.factionId;
  return factionId === 'cat' || factionId === 'mouse' ? factionId : null;
}

function normalizeTableFaction(tableFaction: unknown): FactionId | null {
  if (tableFaction === '猫') return 'cat';
  if (tableFaction === '鼠') return 'mouse';
  return null;
}

function enrichCharacterData(tables: CharacterTable[]): EnrichedCharacterRow[] {
  const enriched: EnrichedCharacterRow[] = [];

  for (const table of tables) {
    if (table.rank === summarySymbol) continue;

    const rank = String(table.rank);
    const rankOrder = getRankOrder(rank);
    const factionFromTable = normalizeTableFaction(
      (table as unknown as { faction?: unknown }).faction
    );

    for (const row of table.rows) {
      const faction = getFactionIdFromCharacters(row.character) ?? factionFromTable ?? 'mouse';
      enriched.push({
        rank,
        rankOrder,
        character: row.character,
        faction,
        pickRate: row.pickRate,
        winRate: row.winRate,
        banRate: row.banRate || '0.00%',
        pickRateNum: parseRate(row.pickRate),
        winRateNum: parseRate(row.winRate),
        banRateNum: parseRate(row.banRate),
      });
    }
  }

  return enriched;
}

function getSeasons(): string[] {
  return winRatesData.map((entry) => entry.timeRange);
}

function getRanksFromSeason(seasonIndex: number): string[] {
  const entry = winRatesData[seasonIndex];
  if (!entry) return [];

  const ranks = new Set<string>();

  if (entry.characterTables) {
    entry.characterTables.forEach((table) => {
      if (table.rank !== summarySymbol) ranks.add(String(table.rank));
    });
  }

  if (entry.tables) {
    entry.tables.forEach((table) => {
      if ('rank' in table && table.rank !== summarySymbol) ranks.add(String(table.rank));
    });
  }

  return Array.from(ranks).sort((a, b) => getRankOrder(a) - getRankOrder(b));
}

export default function WinRatesClient({ description }: WinRatesClientProps) {
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const seasons = useMemo(() => getSeasons(), []);

  const [selectedSeason, setSelectedSeason] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('winRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set<ColumnKey>(['rank', 'character', 'pickRate', 'winRate', 'banRate', 'faction'])
  );

  const {
    selectedFilters: selectedFactions,
    toggleFilter: toggleFaction,
    hasAnyFilters: hasAnyFactionFilters,
  } = useFilterState<FactionId>();

  const {
    selectedFilters: selectedRanks,
    toggleFilter: toggleRank,
    hasAnyFilters: hasAnyRankFilters,
  } = useFilterState<string>();

  const availableRanks = useMemo(() => getRanksFromSeason(selectedSeason), [selectedSeason]);

  const enrichedData = useMemo(() => {
    const entry = winRatesData[selectedSeason];
    if (!entry) return [];

    const tables: CharacterTable[] = [];

    if (entry.characterTables) tables.push(...entry.characterTables);

    if (entry.tables) {
      entry.tables.forEach((table) => {
        if (!('rows' in table)) return;
        if (table.rows.length === 0) return;
        const first = table.rows[0];
        if (!first || !('character' in first)) return;
        tables.push(table as CharacterTable);
      });
    }

    return enrichCharacterData(tables);
  }, [selectedSeason]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = enrichedData;

    if (hasAnyFactionFilters) {
      filtered = filtered.filter((row) => selectedFactions.has(row.faction));
    }

    if (hasAnyRankFilters) {
      filtered = filtered.filter((row) => selectedRanks.has(row.rank));
    }

    return filtered;
  }, [enrichedData, hasAnyFactionFilters, selectedFactions, hasAnyRankFilters, selectedRanks]);

  const displayRows = useMemo((): DisplayRow[] => {
    const compareMetric = (a: EnrichedCharacterRow, b: EnrichedCharacterRow) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'pickRate':
          comparison = a.pickRateNum - b.pickRateNum;
          break;
        case 'winRate':
          comparison = a.winRateNum - b.winRateNum;
          break;
        case 'banRate':
          comparison = a.banRateNum - b.banRateNum;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    };

    const sorted = [...filteredAndSortedData].sort((a, b) => {
      const rankCompare = a.rankOrder - b.rankOrder;
      if (rankCompare !== 0) return rankCompare;

      const factionCompare =
        (FACTION_ORDER_VALUE[a.faction] ?? 0) - (FACTION_ORDER_VALUE[b.faction] ?? 0);
      if (factionCompare !== 0) return factionCompare;

      return compareMetric(a, b);
    });

    const counts = new Map<string, number>();
    return sorted.map((row) => {
      const key = `${row.rank}__${row.faction}`;
      const nextNo = (counts.get(key) ?? 0) + 1;
      counts.set(key, nextNo);
      return { ...row, no: nextNo, groupStart: nextNo === 1 };
    });
  }, [filteredAndSortedData, sortColumn, sortDirection]);

  const summaryData = useMemo(() => {
    const entry = winRatesData[selectedSeason];
    return entry?.winRateSummary || [];
  }, [selectedSeason]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortColumn(column);
    setSortDirection('desc');
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const isColVisible = (col: ColumnKey) => visibleColumns.has(col);

  const toggleVisibleColumn = (col: ColumnKey) => {
    if (col === 'character') return;
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const renderSortableTh = (label: string, col: SortColumn) => {
    return (
      <th
        className='cursor-pointer border border-gray-300 px-4 py-2 text-left hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-600'
        onClick={() => handleSort(col)}
      >
        {label} {getSortIcon(col)}
      </th>
    );
  };

  const renderTh = (label: string) => (
    <th className='border border-gray-300 px-4 py-2 text-left dark:border-gray-600'>{label}</th>
  );

  const showPercent = summaryData.some((s) => s.percent);

  const handleExportCsv = () => {
    const orderedColumns: Array<ColumnKey> = [
      'rank',
      'faction',
      'character',
      'pickRate',
      'winRate',
      'banRate',
    ];

    const header: string[] = ['No.'];
    for (const col of orderedColumns) {
      if (!isColVisible(col)) continue;
      header.push(
        col === 'rank'
          ? '段位'
          : col === 'faction'
            ? '阵营'
            : col === 'character'
              ? '角色'
              : col === 'pickRate'
                ? '登场率'
                : col === 'winRate'
                  ? '胜率'
                  : '禁用率'
      );
    }

    const rows = displayRows.map((row) => {
      const record: Record<string, unknown> = {
        'No.': row.no,
      };
      if (isColVisible('rank')) record['段位'] = row.rank;
      if (isColVisible('faction')) record['阵营'] = row.faction === 'cat' ? '猫阵营' : '鼠阵营';
      if (isColVisible('character')) record['角色'] = row.character;
      if (isColVisible('pickRate')) record['登场率'] = row.pickRate;
      if (isColVisible('winRate')) record['胜率'] = row.winRate;
      if (isColVisible('banRate')) record['禁用率'] = row.banRate;
      return record;
    });

    const csv = `\uFEFF${toCsv(rows, header)}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const seasonLabel = seasons[selectedSeason] || '未知赛季';
    const date = new Date();
    const yyyy = String(date.getFullYear());
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const fileName = sanitizeFileName(`胜率数据_${seasonLabel}_${yyyy}-${mm}-${dd}.csv`);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>胜率数据统计</PageTitle>
        <PageDescription>{description}</PageDescription>

        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          <FilterRow<string>
            label='赛季筛选:'
            options={seasons}
            isActive={(opt) => seasons[selectedSeason] === opt}
            onToggle={(opt) => setSelectedSeason(Math.max(0, seasons.indexOf(opt)))}
          />

          <FilterRow<FactionId>
            label='阵营筛选:'
            options={['cat', 'mouse']}
            isActive={(opt) => selectedFactions.has(opt)}
            onToggle={(opt) => toggleFaction(opt)}
            getOptionLabel={(opt) => (opt === 'cat' ? '猫阵营' : '鼠阵营')}
            getButtonStyle={(opt, active) =>
              active ? getFactionButtonColors(opt, isDarkMode) : undefined
            }
          />

          {availableRanks.length > 0 && (
            <FilterRow<string>
              label='段位筛选:'
              options={availableRanks}
              isActive={(opt) => selectedRanks.has(opt)}
              onToggle={(opt) => toggleRank(opt)}
            />
          )}

          <FilterRow<Exclude<ColumnKey, 'character'>>
            label='显示列:'
            options={['rank', 'faction', 'pickRate', 'winRate', 'banRate']}
            isActive={(opt) => isColVisible(opt)}
            onToggle={(opt) => toggleVisibleColumn(opt)}
            getOptionLabel={(opt) =>
              opt === 'rank'
                ? '段位'
                : opt === 'faction'
                  ? '阵营'
                  : opt === 'pickRate'
                    ? '登场率'
                    : opt === 'winRate'
                      ? '胜率'
                      : '禁用率'
            }
          />

          <div className={isMobile ? 'mt-2 flex justify-center' : 'mt-4 flex justify-center'}>
            <button
              type='button'
              onClick={handleExportCsv}
              disabled={displayRows.length === 0}
              className='filter-button cursor-pointer rounded-lg border-none px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-60'
              style={
                isDarkMode
                  ? { backgroundColor: '#374151', color: '#e5e7eb' }
                  : { backgroundColor: '#e5e7eb', color: '#111827' }
              }
              aria-label='导出当前表格为 CSV'
            >
              导出 CSV
            </button>
          </div>
        </div>
      </header>

      <section className='space-y-4'>
        <h2 className='text-2xl font-bold'>角色数据 ({filteredAndSortedData.length} 条记录)</h2>

        <div className='overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600'>
          <table className='min-w-full border-collapse bg-white dark:bg-gray-800'>
            <thead>
              <tr className='bg-gray-50 dark:bg-gray-700'>
                {renderTh('No.')}
                {isColVisible('rank') && renderTh('段位')}
                {isColVisible('faction') && renderTh('阵营')}
                {isColVisible('character') && renderTh('角色')}
                {isColVisible('pickRate') && renderSortableTh('登场率', 'pickRate')}
                {isColVisible('winRate') && renderSortableTh('胜率', 'winRate')}
                {isColVisible('banRate') && renderSortableTh('禁用率', 'banRate')}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => {
                const cellBase = 'border border-gray-300 px-4 py-2 dark:border-gray-600';
                const groupDivider = row.groupStart && idx !== 0 ? 'border-t-2' : '';
                const cellClass = `${cellBase} ${groupDivider}`;

                return (
                  <tr
                    key={`${row.rank}-${row.faction}-${row.character}-${idx}`}
                    className='hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    <td className={cn(cellClass, 'tabular-nums')}>{row.no}</td>
                    {isColVisible('rank') && (
                      <td className={cellClass} onDoubleClick={() => toggleRank(row.rank)}>
                        {row.rank}
                      </td>
                    )}
                    {isColVisible('faction') && (
                      <td className={cellClass} onDoubleClick={() => toggleFaction(row.faction)}>
                        {row.faction === 'cat' ? '猫阵营' : '鼠阵营'}
                      </td>
                    )}
                    {isColVisible('character') && (
                      <td className={cn(cellClass, 'font-medium')}>
                        <Link href={`/characters/${encodeURIComponent(row.character)}`}>
                          {row.character}
                        </Link>
                      </td>
                    )}
                    {isColVisible('pickRate') && <td className={cellClass}>{row.pickRate}</td>}
                    {isColVisible('winRate') && (
                      <td className={cellClass}>
                        <span
                          className={
                            row.winRateNum >= 50
                              ? 'font-semibold text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {row.winRate}
                        </span>
                      </td>
                    )}
                    {isColVisible('banRate') && <td className={cellClass}>{row.banRate}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayRows.length === 0 && (
          <p className='text-center text-gray-500 dark:text-gray-400'>没有符合条件的数据</p>
        )}
      </section>

      {summaryData.length > 0 && (
        <section className='space-y-4'>
          <h2 className='text-2xl font-bold'>赛季总览</h2>
          <div className='overflow-x-auto'>
            <table className='min-w-full border-collapse border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'>
              <thead>
                <tr className='bg-gray-100 dark:bg-gray-700'>
                  <th className='border border-gray-300 px-4 py-2 text-left dark:border-gray-600'>
                    段位
                  </th>
                  <th className='border border-gray-300 px-4 py-2 text-left dark:border-gray-600'>
                    组队类型
                  </th>
                  <th className='border border-gray-300 px-4 py-2 text-left dark:border-gray-600'>
                    猫胜率
                  </th>
                  <th className='border border-gray-300 px-4 py-2 text-left dark:border-gray-600'>
                    鼠胜率
                  </th>
                  {showPercent && (
                    <th className='border border-gray-300 px-4 py-2 text-left dark:border-gray-600'>
                      占比
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {summaryData.map(
                  (
                    summary: {
                      rank: string | symbol;
                      teamType: string;
                      catWin: string;
                      mouseWin: string;
                      percent?: string;
                    },
                    index: number
                  ) => (
                    <tr key={index} className='hover:bg-gray-50 dark:hover:bg-gray-700'>
                      <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                        {summary.rank === summarySymbol ? '总计' : String(summary.rank)}
                      </td>
                      <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                        {summary.teamType}
                      </td>
                      <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                        {summary.catWin}
                      </td>
                      <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                        {summary.mouseWin}
                      </td>
                      {showPercent && (
                        <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                          {summary.percent || '-'}
                        </td>
                      )}
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
