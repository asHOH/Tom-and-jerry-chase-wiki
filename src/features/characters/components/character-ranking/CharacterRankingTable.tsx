'use client';

import { useMemo, useState } from 'react';
import { Reorder, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/design';
import type { FactionId } from '@/data/types';
import {
  getPropertiesForFaction,
  getPropertyInfo,
  rankCharactersByProperty,
  type RankableProperty,
  type RankedCharacter,
} from '@/features/characters/utils/ranking';
import Button from '@/components/ui/Button';
import Link from '@/components/Link';

import { toRankingCsv } from './rankingCsv';
import { TEXT_TABLE_PROPERTIES, type TableColumn } from './tableProperties';

interface CharacterRankingTableProps {
  rankedCharacters: readonly RankedCharacter[];
  selectedProperty: RankableProperty;
  tableColumns: readonly TableColumn[];
  onTableColumnsChange: (columns: TableColumn[]) => void;
  factionId?: FactionId | undefined;
}

export default function CharacterRankingTable({
  rankedCharacters,
  selectedProperty,
  tableColumns,
  onTableColumnsChange,
  factionId,
}: CharacterRankingTableProps) {
  const reducedMotion = useReducedMotion();
  const [selectedColumn, setSelectedColumn] = useState<TableColumn | null>(null);
  const availableProperties = getPropertiesForFaction(factionId);
  const propertyInfo = getPropertyInfo(selectedProperty);
  const numericProperties = availableProperties.filter(
    (property) => property.key !== selectedProperty
  );
  const options = [
    { key: 'rank' as const, label: '排名' },
    { key: 'character' as const, label: '角色' },
    { key: 'rankingValue' as const, label: propertyInfo?.label ?? '' },
    ...numericProperties,
    ...TEXT_TABLE_PROPERTIES,
  ];
  const labels = new Map<TableColumn, string>(
    options.map((option): [TableColumn, string] => [option.key, option.label])
  );
  const columns = tableColumns.filter((key) => labels.has(key));
  const valuesByProperty = useMemo(() => {
    const characters = rankedCharacters.map(({ character }) => character);
    return new Map(
      numericProperties
        .filter((property) => columns.includes(property.key))
        .map((property) => [
          property.key,
          new Map(
            rankCharactersByProperty(characters, property.key).map(
              ({ character, formattedValue }) => [character.id, formattedValue]
            )
          ),
        ])
    );
  }, [rankedCharacters, numericProperties, columns]);

  const getCellValue = ({ character, rank, formattedValue }: RankedCharacter, key: TableColumn) => {
    if (key === 'character') return character.id;
    if (key === 'rank') return String(rank);
    if (key === 'rankingValue') return formattedValue;
    const textProperty = TEXT_TABLE_PROPERTIES.find((property) => property.key === key);
    return (
      (textProperty
        ? textProperty.getValue(character)
        : valuesByProperty.get(key as RankableProperty)?.get(character.id)) || '—'
    );
  };

  const exportCsv = () => {
    const csv = toRankingCsv([
      columns.map((key) => labels.get(key) ?? ''),
      ...rankedCharacters.map((character) => columns.map((key) => getCellValue(character, key))),
    ]);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `角色属性排行榜_${propertyInfo?.label ?? '角色'}.csv`.replace(
      /[\\/:*?"<>|]/g,
      '_'
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const toggleColumn = (key: TableColumn, checked: boolean) => {
    setSelectedColumn(null);
    onTableColumnsChange(
      checked ? [...tableColumns, key] : tableColumns.filter((column) => column !== key)
    );
  };

  const reorderColumns = (reordered: TableColumn[]) => {
    let index = 0;
    onTableColumnsChange(
      tableColumns.map((column) => (labels.has(column) ? reordered[index++]! : column))
    );
  };

  const moveColumn = (key: TableColumn, direction: -1 | 1) => {
    const index = columns.indexOf(key);
    const target = index + direction;
    if (target < 0 || target >= columns.length) return;
    const reordered = [...columns];
    const other = reordered[target]!;
    reordered[target] = key;
    reordered[index] = other;
    reorderColumns(reordered);
  };

  const selectColumn = (key: TableColumn) => {
    if (!selectedColumn || !columns.includes(selectedColumn)) {
      setSelectedColumn(key);
      return;
    }
    if (selectedColumn !== key) {
      const reordered = [...columns];
      const from = reordered.indexOf(selectedColumn);
      const to = reordered.indexOf(key);
      reordered[from] = key;
      reordered[to] = selectedColumn;
      reorderColumns(reordered);
    }
    setSelectedColumn(null);
  };

  return (
    <div className='mx-auto w-full max-w-6xl space-y-4 px-4'>
      <details className='border-border bg-surface-sunken rounded-lg border p-4'>
        <summary className='cursor-pointer font-medium text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-100'>
          自定义显示属性
        </summary>
        <div className='mt-4'>
          <p className='text-sm font-medium'>显示列</p>
          <div className='mt-2 overflow-x-auto py-3'>
            <Reorder.Group
              as='ol'
              axis='x'
              values={columns}
              onReorder={(reordered) => {
                setSelectedColumn(null);
                reorderColumns(reordered);
              }}
              className='flex w-max gap-2 py-1'
              aria-label='显示列'
            >
              {columns.map((key, index) => (
                <Reorder.Item
                  as='li'
                  key={key}
                  value={key}
                  {...(reducedMotion ? { transition: { duration: 0 } } : {})}
                  className={cn(
                    'border-border bg-surface flex touch-none items-center rounded-lg border text-sm select-none',
                    selectedColumn === key && 'ring-focus ring-2'
                  )}
                >
                  <button
                    type='button'
                    aria-label={`${labels.get(key)}列，第${index + 1}位，共${columns.length}列`}
                    aria-keyshortcuts='ArrowLeft ArrowRight'
                    aria-pressed={selectedColumn === key}
                    onClick={() => selectColumn(key)}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                        event.preventDefault();
                        setSelectedColumn(null);
                        moveColumn(key, event.key === 'ArrowLeft' ? -1 : 1);
                      }
                    }}
                    className='flex min-h-11 cursor-grab items-center gap-2 rounded-l-lg px-3 focus-visible:outline-2 focus-visible:outline-offset-2 active:cursor-grabbing'
                  >
                    <span aria-hidden='true' className='text-muted-foreground text-base'>
                      ⠿
                    </span>
                    {labels.get(key)}
                  </button>
                  <button
                    type='button'
                    aria-label={`隐藏${labels.get(key)}列`}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => toggleColumn(key, false)}
                    className='hover:bg-control flex min-h-11 w-8 items-center justify-center rounded-r-lg text-base focus-visible:outline-2 focus-visible:outline-offset-2'
                  >
                    <span aria-hidden='true'>×</span>
                  </button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {columns.length === 0 && <p className='text-muted-foreground text-sm'>暂无显示列</p>}
          </div>
        </div>
        <div className='mt-3'>
          <p className='text-sm font-medium'>隐藏列</p>
          <div className='mt-2 flex flex-wrap gap-2' role='group' aria-label='隐藏列'>
            {options
              .filter((option) => !tableColumns.includes(option.key))
              .map((option) => (
                <button
                  key={option.key}
                  type='button'
                  aria-label={`显示${option.label}列`}
                  onClick={() => toggleColumn(option.key, true)}
                  className='border-border hover:bg-control flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2'
                >
                  <span aria-hidden='true'>＋</span>
                  {option.label}
                </button>
              ))}
          </div>
        </div>
      </details>
      <div className='flex justify-end'>
        <Button
          variant='secondary'
          size='sm'
          onClick={exportCsv}
          disabled={columns.length === 0}
          aria-label='导出角色排名为 CSV'
        >
          导出 CSV
        </Button>
      </div>
      <div
        className='border-border w-full overflow-x-auto rounded-lg border'
        role='region'
        aria-label='角色排名表格，可左右滚动'
        tabIndex={0}
      >
        {columns.length > 0 ? (
          <table className='w-full border-collapse text-left text-sm'>
            <caption className='sr-only'>角色属性排行榜</caption>
            <thead className='bg-surface-sunken'>
              <tr>
                {columns.map((key) => (
                  <th
                    key={key}
                    scope='col'
                    className='border-border border-b px-4 py-3 whitespace-nowrap'
                  >
                    {labels.get(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rankedCharacters.map((rankedCharacter) => (
                <tr
                  key={rankedCharacter.character.id}
                  className='border-border border-b last:border-b-0'
                >
                  {columns.map((key) => {
                    if (key === 'character')
                      return (
                        <th key={key} scope='row' className='px-4 py-3 whitespace-nowrap'>
                          <Link
                            href={`/characters/${rankedCharacter.character.id}`}
                            className='text-blue-700 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-blue-300'
                          >
                            {rankedCharacter.character.id}
                          </Link>
                        </th>
                      );
                    return (
                      <td key={key} className='max-w-64 min-w-28 px-4 py-3 tabular-nums'>
                        {getCellValue(rankedCharacter, key)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className='text-muted-foreground p-4 text-sm'>暂无显示列</p>
        )}
      </div>
    </div>
  );
}
