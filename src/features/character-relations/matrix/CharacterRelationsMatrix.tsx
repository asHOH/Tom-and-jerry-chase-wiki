'use client';

import Link from 'next/link';

import { cn } from '@/lib/design';
import Tooltip from '@/components/ui/Tooltip';

import {
  getRelationMatrixCell,
  type RelationMatrixCell,
  type RelationMatrixDisplayKind,
  type RelationMatrixEntity,
  type RelationMatrixViewModel,
} from './relationMatrixViewModel';

type CharacterRelationsMatrixProps = {
  viewModel: RelationMatrixViewModel;
};

type RelationStyleClasses = {
  fill: string;
  dot: string;
  legend: string;
};

const RELATION_STYLE_CLASSES = {
  collaborator: {
    fill: 'bg-green-500 dark:bg-green-500/80',
    dot: 'bg-green-500 dark:bg-green-400',
    legend: 'bg-green-500',
  },
  counter: {
    fill: 'bg-blue-500 dark:bg-blue-500/80',
    dot: 'bg-blue-500 dark:bg-blue-400',
    legend: 'bg-blue-500',
  },
  counteredBy: {
    fill: 'bg-red-500 dark:bg-red-500/80',
    dot: 'bg-red-500 dark:bg-red-400',
    legend: 'bg-red-500',
  },
  counterEachOther: {
    fill: 'bg-amber-400 dark:bg-amber-500/80',
    dot: 'bg-amber-500 dark:bg-amber-400',
    legend: 'bg-amber-400',
  },
} satisfies Record<RelationMatrixDisplayKind, RelationStyleClasses>;

const RELATION_LEGEND_ITEMS = [
  { kind: 'counter', label: '克制' },
  { kind: 'counteredBy', label: '被克制' },
  { kind: 'counterEachOther', label: '互克' },
  { kind: 'collaborator', label: '协作' },
] satisfies readonly { kind: RelationMatrixDisplayKind; label: string }[];

const columnHeaderChunkPattern = /[A-Za-z0-9]+|./gu;

const getColumnHeaderChunks = (label: string): string[] => {
  const rawChunks = label.match(columnHeaderChunkPattern) ?? [label];
  if (Array.from(label).length <= 5) return rawChunks;

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
      className={cn('block h-3 w-3 rounded-full', RELATION_STYLE_CLASSES[cell.displayKind].dot)}
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
            !cell.isMinor && RELATION_STYLE_CLASSES[cell.displayKind].fill
          )}
          triggerProps={{ 'aria-label': cell.tooltipContent }}
        >
          <CellMarker cell={cell} />
        </Tooltip>
      ) : null}
    </td>
  );
};

const ColumnHeader = ({ column }: { column: RelationMatrixEntity }) => (
  <th
    scope='col'
    className='sticky top-0 z-20 h-28 w-7 min-w-7 border border-gray-200 bg-white p-0 align-bottom dark:border-slate-700 dark:bg-slate-900'
  >
    <Link
      href={column.href}
      aria-label={column.label}
      title={column.label}
      className='flex h-28 w-7 items-end justify-center overflow-hidden px-0.5 py-1 text-center text-[11px] leading-tight font-medium text-gray-700 hover:text-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none dark:text-gray-200 dark:hover:text-blue-300'
    >
      <span className='flex max-h-full flex-col items-center justify-end gap-0.5 overflow-hidden'>
        {getColumnHeaderChunks(column.label).map((chunk, index) => (
          <span key={`${column.key}-${chunk}-${index}`} className='max-w-6 truncate'>
            {chunk}
          </span>
        ))}
      </span>
    </Link>
  </th>
);

const RowHeader = ({ row }: { row: RelationMatrixEntity }) => (
  <th
    scope='row'
    className='sticky left-0 z-10 h-7 max-w-28 min-w-24 border border-gray-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-900'
  >
    <Link
      href={row.href}
      aria-label={row.label}
      title={row.label}
      className='block max-w-28 truncate px-2 py-1 text-left text-[12px] leading-5 font-medium whitespace-nowrap text-gray-700 hover:text-blue-600 focus:ring-2 focus:ring-blue-400 focus:outline-none dark:text-gray-200 dark:hover:text-blue-300'
    >
      {row.label}
    </Link>
  </th>
);

export const RelationMatrixLegend = () => (
  <div className='flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300'>
    {RELATION_LEGEND_ITEMS.map((item) => (
      <span key={item.kind} className='inline-flex items-center gap-1'>
        <span
          aria-hidden='true'
          className={cn('h-2.5 w-2.5 rounded-sm', RELATION_STYLE_CLASSES[item.kind].legend)}
        />
        {item.label}
      </span>
    ))}
    <span className='inline-flex items-center gap-1'>
      <span aria-hidden='true' className='h-2.5 w-2.5 rounded-sm bg-gray-400' />
      主要关系为整格填色
    </span>
    <span className='inline-flex items-center gap-1'>
      <span aria-hidden='true' className='h-2.5 w-2.5 rounded-full bg-gray-400' />
      次要关系为圆点
    </span>
  </div>
);

export default function CharacterRelationsMatrix({ viewModel }: CharacterRelationsMatrixProps) {
  return (
    <div className='max-h-[calc(100vh-15rem)] overflow-auto rounded-md border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900'>
      <table
        aria-label='角色关系矩阵'
        className='border-separate border-spacing-0 text-xs text-gray-700 dark:text-gray-200'
      >
        <thead>
          <tr>
            <th
              scope='col'
              className='sticky top-0 left-0 z-30 h-28 min-w-24 border border-gray-200 bg-white p-2 text-left align-bottom text-xs font-semibold text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-400'
            >
              角色
            </th>
            {viewModel.columns.map((column) => (
              <ColumnHeader key={column.key} column={column} />
            ))}
          </tr>
        </thead>
        <tbody>
          {viewModel.rows.map((row) => (
            <tr key={row.key}>
              <RowHeader row={row} />
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
