'use client';

import { cn } from '@/lib/design';
import type { CategoryHint } from '@/lib/types';
import Tooltip from '@/components/ui/Tooltip';
import GotoLink from '@/components/GotoLink';

import {
  getRelationMatrixCell,
  type RelationMatrixCell,
  type RelationMatrixColumnCategory,
  type RelationMatrixDisplayKind,
  type RelationMatrixEntity,
  type RelationMatrixRowFaction,
  type RelationMatrixViewModel,
} from './relationMatrixViewModel';

type CharacterRelationsMatrixProps = {
  viewModel: RelationMatrixViewModel;
};

const RELATION_COLOR_CLASSES = {
  collaborator: 'bg-green-500 dark:bg-green-500/90',
  counter: 'bg-blue-500 dark:bg-blue-500/90',
  counteredBy: 'bg-red-500 dark:bg-red-500/90',
  counterEachOther: 'bg-amber-400 dark:bg-amber-500/90',
} satisfies Record<RelationMatrixDisplayKind, string>;

const RELATION_LEGEND_ITEMS = [
  { kind: 'counter', label: '克制' },
  { kind: 'counteredBy', label: '被克制' },
  { kind: 'counterEachOther', label: '互克' },
  { kind: 'collaborator', label: '协作' },
] satisfies readonly { kind: RelationMatrixDisplayKind; label: string }[];

const CHARACTER_CATEGORY_HINT_BY_FACTION = {
  mouse: '鼠角色',
  cat: '猫角色',
} satisfies Record<RelationMatrixRowFaction, CategoryHint>;

const getFactionScopedCategoryHint = (
  factionId: RelationMatrixEntity['factionId'],
  hints: Record<RelationMatrixRowFaction, CategoryHint>,
  fallbackHint: CategoryHint
): CategoryHint => (factionId ? hints[factionId] : fallbackHint);

const getColumnCategoryHint = (
  column: RelationMatrixEntity,
  columnCategory: RelationMatrixColumnCategory
): CategoryHint => {
  switch (columnCategory) {
    case 'mouse':
    case 'cat':
      return CHARACTER_CATEGORY_HINT_BY_FACTION[columnCategory];
    case 'knowledgeCard':
      return getFactionScopedCategoryHint(
        column.factionId,
        { mouse: '鼠知识卡', cat: '猫知识卡' },
        '知识卡'
      );
    case 'specialSkill':
      return getFactionScopedCategoryHint(
        column.factionId,
        { mouse: '鼠特技', cat: '猫特技' },
        '特技'
      );
    case 'map':
      return '地图';
    case 'mode':
      return '游戏模式';
  }
};

const columnHeaderChunkPattern = /[A-Za-z0-9]+|./gu;

const getColumnHeaderChunks = (label: string): string[] => {
  const rawChunks = label.match(columnHeaderChunkPattern) ?? [label];
  if (Array.from(label).length <= 6) return rawChunks;

  const compactChunks: string[] = [];
  let chineseBuffer = '';
  const flushChineseBuffer = () => {
    if (!chineseBuffer) return;
    compactChunks.push(chineseBuffer);
    chineseBuffer = '';
  };

  for (const chunk of rawChunks) {
    if (/^[A-Za-z0-9]+$/.test(chunk)) {
      flushChineseBuffer();
      compactChunks.push(chunk);
      continue;
    }

    chineseBuffer += chunk;
    if (Array.from(chineseBuffer).length === 2) {
      flushChineseBuffer();
    }
  }

  flushChineseBuffer();
  return compactChunks;
};

const CellMarker = ({ cell }: { cell: RelationMatrixCell }) => {
  if (!cell.isMinor) {
    return <span className='sr-only'>{cell.tooltipContent}</span>;
  }

  return (
    <span
      data-testid='relation-minor-dot'
      aria-hidden='true'
      className={cn('block h-3 w-3 rounded-full', RELATION_COLOR_CLASSES[cell.displayKind])}
    />
  );
};

const MatrixCell = ({
  row,
  column,
  viewModel,
}: {
  row: RelationMatrixEntity;
  column: RelationMatrixEntity;
  viewModel: RelationMatrixViewModel;
}) => {
  const cell = getRelationMatrixCell(viewModel, row.key, column.key);

  return (
    <td
      data-testid={`relation-cell-${row.key}-${column.key}`}
      className='h-7 w-7 min-w-7 border border-gray-200 p-0 align-middle dark:border-slate-700'
    >
      {cell ? (
        <Tooltip
          content={cell.tooltipContent}
          className={cn(
            'flex h-7 w-7 cursor-help items-center justify-center border-b-0 transition-opacity hover:opacity-85',
            !cell.isMinor && RELATION_COLOR_CLASSES[cell.displayKind]
          )}
          triggerProps={{ 'aria-label': cell.tooltipContent }}
        >
          <CellMarker cell={cell} />
        </Tooltip>
      ) : null}
    </td>
  );
};

const ColumnHeader = ({
  column,
  columnCategory,
}: {
  column: RelationMatrixEntity;
  columnCategory: RelationMatrixColumnCategory;
}) => (
  <th
    scope='col'
    className='sticky top-0 z-20 h-28 w-7 min-w-7 border border-gray-200 bg-white p-0 align-bottom dark:border-slate-700 dark:bg-slate-900'
  >
    <GotoLink
      name={column.label}
      href={column.href}
      categoryHint={getColumnCategoryHint(column, columnCategory)}
      className='flex h-28 w-7 items-end justify-center overflow-hidden px-0.5 py-1 text-center text-[12px] leading-tight font-medium text-gray-700 no-underline hover:text-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none dark:text-gray-200 dark:hover:text-blue-300'
    >
      <span className='flex max-h-full flex-col items-center justify-end gap-0.5 overflow-hidden'>
        {getColumnHeaderChunks(column.label).map((chunk, index) => (
          <span key={`${column.key}-${chunk}-${index}`} className='max-w-6 truncate'>
            {chunk}
          </span>
        ))}
      </span>
    </GotoLink>
  </th>
);

const RowHeader = ({
  row,
  rowFaction,
}: {
  row: RelationMatrixEntity;
  rowFaction: RelationMatrixRowFaction;
}) => (
  <th
    scope='row'
    className='sticky left-0 z-10 h-7 max-w-28 min-w-24 border border-gray-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900'
  >
    <GotoLink
      name={row.label}
      href={row.href}
      categoryHint={CHARACTER_CATEGORY_HINT_BY_FACTION[rowFaction]}
      triggerClassName='block h-7 leading-none'
      className='block h-7 max-w-28 truncate px-2 py-1 text-left text-[12px] leading-5 font-medium whitespace-nowrap text-gray-700 no-underline hover:text-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none dark:text-gray-200 dark:hover:text-blue-300'
    >
      {row.label}
    </GotoLink>
  </th>
);

export const RelationMatrixLegend = () => (
  <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300'>
    {RELATION_LEGEND_ITEMS.map((item) => (
      <span key={item.kind} className='inline-flex items-center gap-1'>
        <span
          aria-hidden='true'
          className={cn('h-2.5 w-2.5 rounded-xs', RELATION_COLOR_CLASSES[item.kind])}
        />
        {item.label}
      </span>
    ))}
    <span className='inline-flex items-center gap-1'>
      <span aria-hidden='true' className='h-2.5 w-2.5 rounded-xs bg-gray-400' />
      主要关系为整格
    </span>
    <span className='inline-flex items-center gap-1'>
      <span aria-hidden='true' className='h-2 w-2 rounded-full bg-gray-400' />
      次要关系为圆点
    </span>
  </div>
);

export default function CharacterRelationsMatrix({ viewModel }: CharacterRelationsMatrixProps) {
  return (
    <div className='mx-auto max-h-[calc(100vh-15rem)] w-fit max-w-full overflow-auto border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900'>
      <table
        aria-label='角色关系矩阵'
        className='w-max border-separate border-spacing-0 text-xs text-gray-700 dark:text-gray-200'
      >
        <thead>
          <tr>
            <th
              scope='col'
              className='sticky top-0 left-0 z-30 h-28 min-w-24 border border-gray-200 bg-white p-2 text-left align-bottom dark:border-slate-700 dark:bg-slate-900'
            ></th>
            {viewModel.columns.map((column) => (
              <ColumnHeader
                key={column.key}
                column={column}
                columnCategory={viewModel.columnCategory}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {viewModel.rows.map((row) => (
            <tr key={row.key}>
              <RowHeader row={row} rowFaction={viewModel.rowFaction} />
              {viewModel.columns.map((column) => (
                <MatrixCell key={column.key} row={row} column={column} viewModel={viewModel} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
