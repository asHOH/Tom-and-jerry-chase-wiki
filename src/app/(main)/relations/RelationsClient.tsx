'use client';

import { useMemo, useState } from 'react';

import { getFactionButtonColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
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
import FilterRow from '@/components/ui/FilterRow';

type RelationsClientProps = {
  description?: string;
};

const ROW_FACTION_OPTIONS = ['mouse', 'cat'] as const satisfies readonly RelationMatrixRowFaction[];

const ROW_FACTION_LABELS = {
  mouse: '鼠阵营',
  cat: '猫阵营',
} satisfies Record<RelationMatrixRowFaction, string>;

const targetSelectorClassName = 'mt-0 justify-start md:mt-0';

const isFactionTarget = (
  target: RelationMatrixColumnCategory
): target is RelationMatrixRowFaction => target === 'mouse' || target === 'cat';

function RowFactionSelector({
  selected,
  onSelect,
  isDarkMode,
}: {
  selected: RelationMatrixRowFaction;
  onSelect: (rowFaction: RelationMatrixRowFaction) => void;
  isDarkMode: boolean;
}) {
  return (
    <FilterRow<RelationMatrixRowFaction>
      label='行'
      options={ROW_FACTION_OPTIONS}
      isActive={(option) => selected === option}
      onToggle={onSelect}
      getOptionLabel={(option) => ROW_FACTION_LABELS[option]}
      getButtonStyle={(option, active) =>
        active ? getFactionButtonColors(option, isDarkMode) : undefined
      }
      className={targetSelectorClassName}
      ariaLabel='行目标类型'
    />
  );
}

function ColumnCategorySelector({
  options,
  selected,
  onSelect,
  isDarkMode,
}: {
  options: readonly RelationMatrixColumnCategoryOption[];
  selected: RelationMatrixColumnCategory;
  onSelect: (columnCategory: RelationMatrixColumnCategory) => void;
  isDarkMode: boolean;
}) {
  const optionIds = options.map((option) => option.id);

  return (
    <FilterRow<RelationMatrixColumnCategory>
      label='列'
      options={optionIds}
      isActive={(option) => selected === option}
      onToggle={onSelect}
      getOptionLabel={(option) =>
        options.find((columnOption) => columnOption.id === option)?.label ?? option
      }
      getButtonStyle={(option, active) =>
        active && isFactionTarget(option) ? getFactionButtonColors(option, isDarkMode) : undefined
      }
      className={targetSelectorClassName}
      ariaLabel='列目标类型'
    />
  );
}

export default function RelationsClient({ description }: RelationsClientProps) {
  const [isDarkMode] = useDarkMode();
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
          <RowFactionSelector
            selected={rowFaction}
            onSelect={handleRowFactionSelect}
            isDarkMode={isDarkMode}
          />
          <ColumnCategorySelector
            options={columnCategoryOptions}
            selected={coercedColumnCategory}
            onSelect={setColumnCategory}
            isDarkMode={isDarkMode}
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
