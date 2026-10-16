'use client';

import { useMemo, useState } from 'react';

import { cn, getFactionButtonColors } from '@/lib/design';
import { useFilterState } from '@/lib/filterUtils';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data/types';
import { winRatesData } from '@/data/winRates';
import type { WinRateCharacterLookup } from '@/data/winRates/characterLookup';
import { getWinRateRanks, normalizeWinRateRows } from '@/data/winRates/normalize';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ClearFiltersButton from '@/components/ui/ClearFiltersButton';
import FilterRow from '@/components/ui/FilterRow';
import PageHeader from '@/components/ui/PageHeader';
import PageShell from '@/components/ui/PageShell';
import SectionHeader from '@/components/ui/SectionHeader';
import Link from '@/components/Link';

import {
  getRankLabel,
  getWinRateDisplayRows,
  sanitizeFileName,
  toWinRatesCsv,
  WIN_RATE_COLUMNS,
  type ColumnKey,
  type SortColumn,
  type SortDirection,
} from './tableModel';

const TABLE_CLASS_NAME = 'w-full table-fixed border-collapse text-left';
const TABLE_CELL_CLASS_NAME = 'border-border border px-4 py-2';
const seasons = winRatesData.map((entry) => entry.timeRange);

function getRanksFromSeason(seasonIndex: number): string[] {
  const entry = winRatesData[seasonIndex];
  return entry ? getWinRateRanks(entry) : [];
}

type WinRatesClientProps = {
  description: string;
  characterLookup: WinRateCharacterLookup;
};

export default function WinRatesClient({ description, characterLookup }: WinRatesClientProps) {
  const [isDarkMode] = useDarkMode();

  const [selectedSeason, setSelectedSeason] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>('winRateNum');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(WIN_RATE_COLUMNS.map((column) => column.key))
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

    return normalizeWinRateRows(entry, characterLookup);
  }, [selectedSeason, characterLookup]);

  const hasBanRates = enrichedData.some((row) => row.banRateNum !== null);
  const effectiveSortColumn =
    sortColumn === 'banRateNum' && !hasBanRates ? 'winRateNum' : sortColumn;
  const effectiveSortDirection = effectiveSortColumn === sortColumn ? sortDirection : 'desc';

  const displayRows = useMemo(
    () =>
      getWinRateDisplayRows(enrichedData, {
        ranks: selectedRanks,
        factions: selectedFactions,
        sortColumn: effectiveSortColumn,
        sortDirection: effectiveSortDirection,
      }),
    [enrichedData, selectedRanks, selectedFactions, effectiveSortColumn, effectiveSortDirection]
  );

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

  const availableColumns = WIN_RATE_COLUMNS.filter(
    (column) => column.key !== 'banRate' || hasBanRates
  );
  const displayedColumns = availableColumns.filter((column) => isColVisible(column.key));
  const toggleableColumns = availableColumns.filter(
    (column) => !['character', 'rank', 'faction'].includes(column.key)
  );

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
        key={col}
        scope='col'
        className={cn(
          TABLE_CELL_CLASS_NAME,
          'p-0',
          effectiveSortColumn === col && 'text-blue-600 dark:text-blue-400'
        )}
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

  const renderTh = (label: string, className?: string) => (
    <th key={label} scope='col' className={cn(TABLE_CELL_CLASS_NAME, className)}>
      {label}
    </th>
  );

  const showPercent = summaryData.some((s) => s.percent);

  const handleExportCsv = () => {
    const csv = `\uFEFF${toWinRatesCsv(displayRows, displayedColumns)}`;
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
            getOptionLabel={(season) => season.replace(/-\d{4}\./, '-')}
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
              getOptionLabel={(rank) => getRankLabel(rank)}
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

          <FilterRow<ColumnKey>
            label='显示列:'
            options={toggleableColumns.map((column) => column.key)}
            isActive={isColVisible}
            onToggle={toggleVisibleColumn}
            getOptionLabel={(key) => WIN_RATE_COLUMNS.find((column) => column.key === key)?.label}
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
        <SectionHeader title={`角色数据 (${displayRows.length} 条记录)`} />

        {!hasBanRates ? (
          <p className='text-muted-foreground mb-2 text-sm'>本赛季未提供禁用率数据。</p>
        ) : null}

        <Card bordered className='overflow-hidden p-0'>
          <div className='overflow-x-auto'>
            <table className={cn(TABLE_CLASS_NAME, 'min-w-200')}>
              <caption className='sr-only'>
                角色数据：按段位和阵营分组，使用表头按钮进行组内排序。
              </caption>
              <thead>
                <tr className='bg-surface-muted'>
                  {renderTh('No.', 'w-16')}
                  {displayedColumns.map((column) =>
                    column.sortKey
                      ? renderSortableTh(column.label, column.sortKey)
                      : renderTh(column.label, column.widthClassName)
                  )}
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
                      className='hover:bg-surface-muted/50'
                    >
                      <td className={cn(cellClass, 'tabular-nums')}>{row.no}</td>
                      {displayedColumns.map((column) => {
                        const value = column.getValue(row);
                        const content = value ?? '—';
                        return (
                          <td
                            key={column.key}
                            className={cn(cellClass, column.key === 'character' && 'font-medium')}
                            onDoubleClick={
                              column.key === 'rank'
                                ? () => toggleRank(row.rank)
                                : column.key === 'faction'
                                  ? () => toggleFaction(row.faction)
                                  : undefined
                            }
                          >
                            {column.key === 'character' && row.characterId ? (
                              <Link href={`/characters/${encodeURIComponent(row.characterId)}`}>
                                {content}
                              </Link>
                            ) : column.key === 'winRate' ? (
                              <span
                                className={
                                  row.winRateNum >= 50
                                    ? 'font-semibold text-green-600 dark:text-green-400'
                                    : 'text-red-600 dark:text-red-400'
                                }
                              >
                                {content}
                              </span>
                            ) : (
                              content
                            )}
                          </td>
                        );
                      })}
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
              <table className={cn(TABLE_CLASS_NAME, 'min-w-120')}>
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
                      <tr key={index} className='hover:bg-surface-muted/50'>
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
