'use client';

import { useMemo, useState } from 'react';

import { cn, getFactionButtonColors } from '@/lib/design';
import { useFilterState } from '@/lib/filterUtils';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data/types';
import { CharacterTable, winRatesData } from '@/data/winRates';
import Button from '@/components/ui/Button';
import ClearFiltersButton from '@/components/ui/ClearFiltersButton';
import FilterRow from '@/components/ui/FilterRow';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import SectionHeader from '@/components/ui/SectionHeader';
import Link from '@/components/Link';

import { normalizeWinRateCharacterName, type WinRateCharacterLookup } from './characterLookup';

type ColumnKey = 'rank' | 'faction' | 'character' | 'pickRate' | 'winRate' | 'banRate';
type SortColumn = 'pickRate' | 'winRate' | 'banRate';
type SortDirection = 'asc' | 'desc';

interface EnrichedCharacterRow {
  rank: string;
  rankOrder: number;
  character: string;
  characterId: string | null;
  faction: FactionId;
  pickRate: string;
  winRate: string;
  banRate: string | null;
  pickRateNum: number;
  winRateNum: number;
  banRateNum: number | null;
}

interface WinRatesClientProps {
  description: string;
  characterLookup: WinRateCharacterLookup;
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

function parseRate(rate: string): number {
  return parseFloat(rate.replace('%', ''));
}

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

const FACTION_ORDER_VALUE: Readonly<Record<FactionId, number>> = {
  mouse: 0,
  cat: 1,
};

type DisplayRow = EnrichedCharacterRow & { no: number; groupStart: boolean };

function getRankOrder(rank: string): number {
  const idx = RANK_ORDER.indexOf(rank);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

function getRankLabel(rank: string): string {
  return rank === '全部' ? '全段位' : rank;
}

function normalizeTableFaction(tableFaction: unknown): FactionId | null {
  if (tableFaction === '猫') return 'cat';
  if (tableFaction === '鼠') return 'mouse';
  return null;
}

function enrichCharacterData(
  tables: CharacterTable[],
  characterLookup: WinRateCharacterLookup
): EnrichedCharacterRow[] {
  const enriched: EnrichedCharacterRow[] = [];

  for (const table of tables) {
    const rank = String(table.rank);
    const rankOrder = getRankOrder(rank);
    const factionFromTable = normalizeTableFaction(table.faction);

    for (const row of table.rows) {
      const character = characterLookup[normalizeWinRateCharacterName(row.character)];
      const faction = character?.factionId ?? factionFromTable ?? 'mouse';
      enriched.push({
        rank,
        rankOrder,
        character: row.character,
        characterId: character?.id ?? null,
        faction,
        pickRate: row.pickRate,
        winRate: row.winRate,
        banRate: row.banRate ?? null,
        pickRateNum: parseRate(row.pickRate),
        winRateNum: parseRate(row.winRate),
        banRateNum: row.banRate === undefined ? null : parseRate(row.banRate),
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
      ranks.add(String(table.rank));
    });
  }

  if (entry.tables) {
    entry.tables.forEach((table) => {
      if ('rank' in table) ranks.add(String(table.rank));
    });
  }

  return Array.from(ranks).sort((a, b) => getRankOrder(a) - getRankOrder(b));
}

export default function WinRatesClient({ description, characterLookup }: WinRatesClientProps) {
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
    clearFilters: clearFactions,
    hasAnyFilters: hasAnyFactionFilters,
  } = useFilterState<FactionId>();

  const {
    selectedFilters: selectedRanks,
    toggleFilter: toggleRank,
    clearFilters: clearRanks,
    setFilters: setRanks,
    hasAnyFilters: hasAnyRankFilters,
  } = useFilterState<string>();

  const availableRanks = useMemo(() => getRanksFromSeason(selectedSeason), [selectedSeason]);

  const handleSeasonChange = (season: string) => {
    const nextSeason = seasons.indexOf(season);
    const nextRanks = getRanksFromSeason(nextSeason);
    setRanks(new Set([...selectedRanks].filter((rank) => nextRanks.includes(rank))));
    setSelectedSeason(nextSeason);
  };

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

    return enrichCharacterData(tables, characterLookup);
  }, [selectedSeason, characterLookup]);

  const hasBanRates = enrichedData.some((row) => row.banRateNum !== null);
  const effectiveSortColumn = sortColumn === 'banRate' && !hasBanRates ? 'winRate' : sortColumn;
  const effectiveSortDirection = effectiveSortColumn === sortColumn ? sortDirection : 'desc';

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
      switch (effectiveSortColumn) {
        case 'pickRate':
          comparison = a.pickRateNum - b.pickRateNum;
          break;
        case 'winRate':
          comparison = a.winRateNum - b.winRateNum;
          break;
        case 'banRate':
          if (a.banRateNum === null) return b.banRateNum === null ? 0 : 1;
          if (b.banRateNum === null) return -1;
          comparison = a.banRateNum - b.banRateNum;
          break;
      }
      return effectiveSortDirection === 'asc' ? comparison : -comparison;
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
  }, [filteredAndSortedData, effectiveSortColumn, effectiveSortDirection]);

  const summaryData = useMemo(() => {
    const entry = winRatesData[selectedSeason];
    return entry?.winRateSummary || [];
  }, [selectedSeason]);

  const handleSort = (column: SortColumn) => {
    setSortColumn(column);
    setSortDirection(
      effectiveSortColumn === column && effectiveSortDirection === 'desc' ? 'asc' : 'desc'
    );
  };

  const getSortIcon = (column: SortColumn) => {
    if (effectiveSortColumn !== column) return '↕';
    return effectiveSortDirection === 'asc' ? '↑' : '↓';
  };

  const isColVisible = (col: ColumnKey) =>
    visibleColumns.has(col) && (col !== 'banRate' || hasBanRates);

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
        className='hover:bg-control cursor-pointer border border-gray-300 px-4 py-2 text-left dark:border-gray-600'
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
      if (isColVisible('rank')) record['段位'] = getRankLabel(row.rank);
      if (isColVisible('faction')) record['阵营'] = row.faction === 'cat' ? '猫' : '鼠';
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
    <PageShell width='maximum' className='space-y-2 md:space-y-8 dark:text-slate-200'>
      <PageHeader title='胜率数据统计' description={description} className='mb-4 md:mb-8'>
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          <FilterRow<string>
            label='赛季筛选:'
            options={seasons}
            isActive={(opt) => seasons[selectedSeason] === opt}
            onToggle={handleSeasonChange}
          />

          <FilterRow<FactionId>
            label='阵营筛选:'
            options={['cat', 'mouse']}
            isActive={(opt) => selectedFactions.has(opt)}
            onToggle={(opt) => toggleFaction(opt)}
            getOptionLabel={(opt) => (opt === 'cat' ? '猫' : '鼠')}
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
              getOptionLabel={getRankLabel}
            />
          )}

          {(hasAnyFactionFilters || hasAnyRankFilters) && (
            <div className='mt-2 flex justify-center md:mt-4'>
              <ClearFiltersButton
                onClick={() => {
                  clearFactions();
                  clearRanks();
                }}
              />
            </div>
          )}

          <FilterRow<Exclude<ColumnKey, 'character'>>
            label='显示列:'
            options={
              hasBanRates
                ? ['rank', 'faction', 'pickRate', 'winRate', 'banRate']
                : ['rank', 'faction', 'pickRate', 'winRate']
            }
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

          <div className='mt-2 flex justify-center md:mt-4'>
            <Button
              variant='unstyled'
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
            </Button>
          </div>
        </div>
      </PageHeader>

      <section>
        <SectionHeader title={`角色数据 (${filteredAndSortedData.length} 条记录)`} />

        {!hasBanRates ? (
          <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>本赛季未提供禁用率数据。</p>
        ) : isColVisible('banRate') && displayRows.some((row) => row.banRate === null) ? (
          <p className='mb-2 text-sm text-gray-500 dark:text-gray-400'>
            — 表示该条记录未提供禁用率数据。
          </p>
        ) : null}

        <div className='overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600'>
          <table className='bg-surface min-w-full border-collapse'>
            <thead>
              <tr className='bg-surface-muted'>
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
                const groupDivider = row.groupStart && idx !== 0 ? 'border-t-3' : '';
                const cellClass = `${cellBase} ${groupDivider}`;

                return (
                  <tr
                    key={`${row.rank}-${row.faction}-${row.character}-${idx}`}
                    className='hover:bg-control'
                  >
                    <td className={cn(cellClass, 'tabular-nums')}>{row.no}</td>
                    {isColVisible('rank') && (
                      <td className={cellClass} onDoubleClick={() => toggleRank(row.rank)}>
                        {getRankLabel(row.rank)}
                      </td>
                    )}
                    {isColVisible('faction') && (
                      <td className={cellClass} onDoubleClick={() => toggleFaction(row.faction)}>
                        {row.faction === 'cat' ? '猫' : '鼠'}
                      </td>
                    )}
                    {isColVisible('character') && (
                      <td className={cn(cellClass, 'font-medium')}>
                        {row.characterId ? (
                          <Link href={`/characters/${encodeURIComponent(row.characterId)}`}>
                            {row.character}
                          </Link>
                        ) : (
                          row.character
                        )}
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
                    {isColVisible('banRate') && <td className={cellClass}>{row.banRate ?? '—'}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {displayRows.length === 0 && (
          <p className='mt-4 text-center text-gray-500 dark:text-gray-400'>没有符合条件的数据</p>
        )}
      </section>

      {summaryData.length > 0 && (
        <section>
          <SectionHeader title='赛季总览' />
          <div className='overflow-x-auto'>
            <table className='bg-surface min-w-full border-collapse border border-gray-300 dark:border-gray-600'>
              <thead>
                <tr className='bg-surface-muted'>
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
                    <tr key={index} className='hover:bg-control'>
                      <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                        {getRankLabel(String(summary.rank))}
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
    </PageShell>
  );
}
