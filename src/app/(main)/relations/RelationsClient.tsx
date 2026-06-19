'use client';

import { useMemo, useState } from 'react';

import { cn } from '@/lib/design';
import CharacterRelationsMatrix, {
  RelationMatrixLegend,
} from '@/features/character-relations/matrix/CharacterRelationsMatrix';
import {
  buildRelationMatrixViewModel,
  coerceColumnCategory,
  getLegalColumnCategories,
  type RelationMatrixColumnCategory,
  type RelationMatrixColumnCategoryOption,
  type RelationMatrixRowFaction,
} from '@/features/character-relations/matrix/relationMatrixViewModel';
import CatalogPageShell from '@/components/ui/CatalogPageShell';

type RelationsClientProps = {
  description?: string;
};

type RowFactionOption = {
  id: RelationMatrixRowFaction;
  label: string;
};

const ROW_FACTION_OPTIONS = [
  { id: 'mouse', label: '鼠阵营' },
  { id: 'cat', label: '猫阵营' },
] satisfies readonly RowFactionOption[];

const segmentButtonClassName =
  'min-h-9 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none';

const getSegmentButtonClassName = (active: boolean) =>
  cn(
    segmentButtonClassName,
    active
      ? 'border-blue-500 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-500'
      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:border-blue-500 dark:hover:text-blue-300'
  );

function RowFactionSelector({
  selected,
  onSelect,
}: {
  selected: RelationMatrixRowFaction;
  onSelect: (rowFaction: RelationMatrixRowFaction) => void;
}) {
  return (
    <div className='flex flex-wrap items-center gap-2' role='group' aria-label='行角色阵营'>
      <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>行角色</span>
      {ROW_FACTION_OPTIONS.map((option) => (
        <button
          key={option.id}
          type='button'
          aria-pressed={selected === option.id}
          className={getSegmentButtonClassName(selected === option.id)}
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ColumnCategorySelector({
  options,
  selected,
  onSelect,
}: {
  options: readonly RelationMatrixColumnCategoryOption[];
  selected: RelationMatrixColumnCategory;
  onSelect: (columnCategory: RelationMatrixColumnCategory) => void;
}) {
  return (
    <div className='flex flex-wrap items-center gap-2' role='group' aria-label='列目标类型'>
      <span className='text-sm font-medium text-gray-600 dark:text-gray-300'>列目标</span>
      {options.map((option) => (
        <button
          key={option.id}
          type='button'
          aria-pressed={selected === option.id}
          className={getSegmentButtonClassName(selected === option.id)}
          onClick={() => onSelect(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function RelationsClient({ description }: RelationsClientProps) {
  const [rowFaction, setRowFaction] = useState<RelationMatrixRowFaction>('mouse');
  const [columnCategory, setColumnCategory] = useState<RelationMatrixColumnCategory>('cat');
  const coercedColumnCategory = coerceColumnCategory(rowFaction, columnCategory);
  const columnCategoryOptions = getLegalColumnCategories(rowFaction);
  const viewModel = useMemo(
    () =>
      buildRelationMatrixViewModel({
        rowFaction,
        columnCategory: coercedColumnCategory,
      }),
    [coercedColumnCategory, rowFaction]
  );

  const handleRowFactionSelect = (nextRowFaction: RelationMatrixRowFaction) => {
    setRowFaction(nextRowFaction);
    setColumnCategory((currentColumnCategory) =>
      coerceColumnCategory(nextRowFaction, currentColumnCategory)
    );
  };

  return (
    <CatalogPageShell
      title='角色关系'
      description={description}
      descriptionVisibility='desktop'
      filters={
        <div className='flex flex-col gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900/60'>
          <RowFactionSelector selected={rowFaction} onSelect={handleRowFactionSelect} />
          <ColumnCategorySelector
            options={columnCategoryOptions}
            selected={coercedColumnCategory}
            onSelect={setColumnCategory}
          />
          <RelationMatrixLegend />
        </div>
      }
      filtersClassName='max-w-5xl'
      contentTopSpacing='default'
      contentClassName='px-0 md:px-2'
    >
      <CharacterRelationsMatrix viewModel={viewModel} />
    </CatalogPageShell>
  );
}
