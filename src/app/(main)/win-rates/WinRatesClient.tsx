'use client';

import { useMemo, useState } from 'react';

import { cn, getFactionButtonColors } from '@/lib/design';
import { useFilterState } from '@/lib/filterUtils';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data/types';
import { CharacterTable, winRatesData } from '@/data/winRates';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
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

const TABLE_CLASS_NAME = 'min-w-full border-collapse text-left';
const TABLE_CELL_CLASS_NAME = 'border-border border px-4 py-2';

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
        scope='col'
        className={cn(TABLE_CELL_CLASS_NAME, 'p-0')}
        aria-sort={
          effectiveSortColumn === col
            ? effectiveSortDirection === 'asc'
              ? 'ascending'
              : 'descending'
            : undefined
        }
      >
        <Button
          variant='unstyled'
          onClick={() => handleSort(col)}
          className='hover:bg-control focus-visible:outline-focus flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left focus-visible:outline-2 focus-visible:-outline-offset-2'
        >
          {label} <span aria-hidden='true'>{getSortIcon(col)}</span>
        </Button>
      </th>
    );
  };

  const renderTh = (label: string) => (
    <th scope='col' className={TABLE_CELL_CLASS_NAME}>
      {label}
    </th>
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
    <PageShell width='maximum' className='space-y-2 md:space-y-8'>
      <PageHeader title='胜率统计' description={description} className='mb-4 md:mb-8'>
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
              variant='secondary'
              size='sm'
              type='button'
              onClick={handleExportCsv}
              disabled={displayRows.length === 0}
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
          <p className='text-muted-foreground mb-2 text-sm'>本赛季未提供禁用率数据。</p>
        ) : null}

        <Card bordered className='overflow-hidden p-0'>
          <div className='overflow-x-auto'>
            <table className={TABLE_CLASS_NAME}>
              <caption className='sr-only'>
                角色数据：按段位和阵营分组，使用表头按钮进行组内排序。
              </caption>
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
                  const cellClass = cn(
                    TABLE_CELL_CLASS_NAME,
                    row.groupStart && idx !== 0 && 'border-t-3'
                  );

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
                      {isColVisible('banRate') && (
                        <td className={cellClass}>{row.banRate ?? '—'}</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {displayRows.length === 0 && (
          <p className='text-muted-foreground mt-4 text-center'>没有符合条件的数据</p>
        )}
      </section>

      {summaryData.length > 0 && (
        <section>
          <SectionHeader title='赛季总览' />
          <Card bordered className='overflow-hidden p-0'>
            <div className='overflow-x-auto'>
              <table className={TABLE_CLASS_NAME}>
                <caption className='sr-only'>赛季总览</caption>
                <thead>
                  <tr className='bg-surface-muted'>
                    {renderTh('段位')}
                    {renderTh('组队类型')}
                    {renderTh('猫胜率')}
                    {renderTh('鼠胜率')}
                    {showPercent && renderTh('占比')}
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((summary, index) => {
                    const cellClass = cn(
                      TABLE_CELL_CLASS_NAME,
                      index > 0 && summary.rank !== summaryData[index - 1]?.rank && 'border-t-3'
                    );
                    return (
                      <tr key={index} className='hover:bg-control'>
                        <td className={cellClass}>{getRankLabel(summary.rank)}</td>
                        <td className={cellClass}>{summary.teamType}</td>
                        <td className={cellClass}>{summary.catWin}</td>
                        <td className={cellClass}>{summary.mouseWin}</td>
                        {showPercent && <td className={cellClass}>{summary.percent || '-'}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}
    </PageShell>
  );
}
