'use client';

import { useMemo, useState } from 'react';

import { getFactionButtonColors } from '@/lib/design-system';
import { useFilterState } from '@/lib/filterUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data/types';
import { CharacterTable, summarySymbol, winRatesData } from '@/data/winRates';
import { catCharactersWithImages } from '@/features/characters/data/catCharacters';
import { mouseCharactersWithImages } from '@/features/characters/data/mouseCharacters';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

type ColumnKey = 'rank' | 'faction' | 'character' | 'pickRate' | 'winRate' | 'banRate';
type GroupMode = 'faction' | 'rank' | 'none';
type SortColumn = ColumnKey;
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

function parseRate(rate: string | undefined): number {
  if (!rate) return 0;
  return parseFloat(rate.replace('%', ''));
}

const RANK_ORDER: readonly string[] = [
  '酷炫铂金',
  '霸气钻石',
  '至尊传奇',
  '无敌猫鼠皇',
  '皇0分-皇2000分',
  '皇2000分以上',
];

function getRankOrder(rank: string): number {
  const idx = RANK_ORDER.indexOf(rank);
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

function getCharacterFaction(characterName: string): FactionId {
  if (catCharactersWithImages[characterName]) return 'cat';
  if (mouseCharactersWithImages[characterName]) return 'mouse';

  const catKeywords = ['汤姆', '泰克', '托普斯', '布奇', '莱特宁', '斯派克'];
  if (catKeywords.some((kw) => characterName.includes(kw))) return 'cat';
  return 'mouse';
}

function normalizeTableFaction(tableFaction: unknown): FactionId | null {
  if (tableFaction === '猫') return 'cat';
  if (tableFaction === '鼠') return 'mouse';
  return null;
}

function enrichCharacterData(tables: CharacterTable[]): EnrichedCharacterRow[] {
  const enriched: EnrichedCharacterRow[] = [];

  for (const table of tables) {
    const rank = table.rank === summarySymbol ? '总计' : String(table.rank);
    const rankOrder = getRankOrder(rank);
    const factionFromTable = normalizeTableFaction(
      (table as unknown as { faction?: unknown }).faction
    );

    for (const row of table.rows) {
      const faction = factionFromTable ?? getCharacterFaction(row.character);
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
  return winRatesData.map((entry) => entry.timeRange || entry.description || '未知');
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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupMode, setGroupMode] = useState<GroupMode>('faction');
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

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'rank':
          comparison = a.rankOrder - b.rankOrder;
          break;
        case 'faction':
          comparison = a.faction === b.faction ? 0 : a.faction === 'cat' ? -1 : 1;
          break;
        case 'character':
          comparison = a.character.localeCompare(b.character, 'zh-CN');
          break;
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
    });

    return sorted;
  }, [
    enrichedData,
    hasAnyFactionFilters,
    selectedFactions,
    hasAnyRankFilters,
    selectedRanks,
    sortColumn,
    sortDirection,
  ]);

  const groupedData = useMemo(() => {
    if (groupMode === 'none') {
      return new Map<string, EnrichedCharacterRow[]>([['全部', filteredAndSortedData]]);
    }

    const groups = new Map<string, EnrichedCharacterRow[]>();
    for (const row of filteredAndSortedData) {
      const key = groupMode === 'faction' ? row.faction : row.rank;
      const prev = groups.get(key) || [];
      prev.push(row);
      groups.set(key, prev);
    }

    if (groupMode === 'faction') {
      const ordered = new Map<string, EnrichedCharacterRow[]>();
      if (groups.has('cat')) ordered.set('cat', groups.get('cat')!);
      if (groups.has('mouse')) ordered.set('mouse', groups.get('mouse')!);
      return ordered;
    }

    return new Map(
      Array.from(groups.entries()).sort(([a], [b]) => getRankOrder(a) - getRankOrder(b))
    );
  }, [filteredAndSortedData, groupMode]);

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

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
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

  const showPercent = summaryData.some((s) => s.percent);

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

          <FilterRow<GroupMode>
            label='分组:'
            options={['faction', 'rank', 'none']}
            isActive={(opt) => groupMode === opt}
            onToggle={(opt) => setGroupMode(opt)}
            getOptionLabel={(opt) =>
              opt === 'faction' ? '阵营' : opt === 'rank' ? '段位' : '不分组'
            }
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

          <FilterRow<ColumnKey>
            label='显示列:'
            options={['rank', 'faction', 'character', 'pickRate', 'winRate', 'banRate']}
            isActive={(opt) => isColVisible(opt)}
            onToggle={(opt) => toggleVisibleColumn(opt)}
            getOptionLabel={(opt) =>
              opt === 'rank'
                ? '段位'
                : opt === 'faction'
                  ? '阵营'
                  : opt === 'character'
                    ? '角色'
                    : opt === 'pickRate'
                      ? '登场率'
                      : opt === 'winRate'
                        ? '胜率'
                        : '禁用率'
            }
            getButtonDisabled={(opt) => opt === 'character'}
          />
        </div>
      </header>

      <section className='space-y-4'>
        <h2 className='text-2xl font-bold'>角色数据 ({filteredAndSortedData.length} 条记录)</h2>

        <div className='space-y-4'>
          {Array.from(groupedData.entries()).map(([groupKey, rows]) => {
            const isSingle = groupMode === 'none';
            const isExpanded = isSingle ? true : expandedGroups.has(groupKey);

            const groupTitle = (() => {
              if (groupMode === 'none') return '全部';
              if (groupMode === 'faction') return groupKey === 'cat' ? '猫阵营' : '鼠阵营';
              return groupKey;
            })();

            return (
              <div
                key={groupKey}
                className='overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600'
              >
                {!isSingle && (
                  <button
                    type='button'
                    onClick={() => toggleGroup(groupKey)}
                    className='flex w-full items-center justify-between bg-gray-100 px-4 py-3 font-semibold text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  >
                    <span>
                      {groupTitle} ({rows.length})
                    </span>
                    <span>{isExpanded ? '▼' : '▶'}</span>
                  </button>
                )}

                {isExpanded && (
                  <div className='overflow-x-auto'>
                    <table className='min-w-full border-collapse bg-white dark:bg-gray-800'>
                      <thead>
                        <tr className='bg-gray-50 dark:bg-gray-700'>
                          {isColVisible('rank') && renderSortableTh('段位', 'rank')}
                          {isColVisible('faction') && renderSortableTh('阵营', 'faction')}
                          {isColVisible('character') && renderSortableTh('角色', 'character')}
                          {isColVisible('pickRate') && renderSortableTh('登场率', 'pickRate')}
                          {isColVisible('winRate') && renderSortableTh('胜率', 'winRate')}
                          {isColVisible('banRate') && renderSortableTh('禁用率', 'banRate')}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr
                            key={`${row.rank}-${row.character}-${idx}`}
                            className='hover:bg-gray-50 dark:hover:bg-gray-700'
                          >
                            {isColVisible('rank') && (
                              <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                                {row.rank}
                              </td>
                            )}
                            {isColVisible('faction') && (
                              <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                                {row.faction === 'cat' ? '猫阵营' : '鼠阵营'}
                              </td>
                            )}
                            {isColVisible('character') && (
                              <td className='border border-gray-300 px-4 py-2 font-medium dark:border-gray-600'>
                                {row.character}
                              </td>
                            )}
                            {isColVisible('pickRate') && (
                              <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                                {row.pickRate}
                              </td>
                            )}
                            {isColVisible('winRate') && (
                              <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
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
                              <td className='border border-gray-300 px-4 py-2 dark:border-gray-600'>
                                {row.banRate}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredAndSortedData.length === 0 && (
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
