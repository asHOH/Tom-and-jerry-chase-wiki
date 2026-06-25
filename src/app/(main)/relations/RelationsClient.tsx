'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { getFactionButtonColors } from '@/lib/design';
import { useSearchParamEditMode } from '@/hooks/useSearchParamEditMode';
import { useUser } from '@/hooks/useUser';
import { useDarkMode } from '@/context/DarkModeContext';
import { useToast } from '@/context/ToastContext';
import { characters } from '@/data/store';
import CharacterRelationsMatrix, {
  RelationMatrixLegend,
  type RelationMatrixCellSelection,
} from '@/features/character-relations/matrix/CharacterRelationsMatrix';
import RelationMatrixCellEditor from '@/features/character-relations/matrix/RelationMatrixCellEditor';
import {
  buildRelationMatrixViewModel,
  coerceColumnCategory,
  getLegalColumnCategories,
  type RelationMatrixColumnCategory,
  type RelationMatrixColumnCategoryOption,
  type RelationMatrixRowFaction,
} from '@/features/character-relations/matrix/relationMatrixViewModel';
import { useRelationMatrixEditMode } from '@/features/character-relations/matrix/useRelationMatrixEditMode';
import { getEditableCharacterRelations } from '@/features/characters/utils/characterRelationOverlay';
import { getCharacterRelation } from '@/features/characters/utils/relationReadModel';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import EditButton from '@/components/ui/EditButton';
import EditModeToolbar from '@/components/ui/EditModeToolbar';
import FilterLabel from '@/components/ui/FilterLabel';
import FilterRow from '@/components/ui/FilterRow';

type RelationsClientProps = {
  description?: string;
};

const ROW_FACTION_OPTIONS = ['mouse', 'cat'] as const satisfies readonly RelationMatrixRowFaction[];

const ROW_FACTION_LABELS = {
  mouse: '鼠',
  cat: '猫',
} satisfies Record<RelationMatrixRowFaction, string>;

const MATRIX_SIZE_MIN = 22;
const MATRIX_SIZE_MAX = 40;
const MATRIX_SIZE_STEP = 2;
const DEFAULT_MATRIX_SIZE = 28;

const targetSelectorClassName = 'mt-0 justify-start md:mt-0';
const RELATION_EDIT_ROLES = new Set(['Contributor', 'Reviewer', 'Coordinator']);

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

function MatrixSizeSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const labelId = useId();

  return (
    <div
      className='mt-0 flex items-center justify-start gap-2 md:mt-0'
      role='group'
      aria-labelledby={labelId}
    >
      <FilterLabel
        id={labelId}
        full='表格大小'
        short='大小'
        className='shrink-0 whitespace-nowrap'
      />
      <div className='flex w-full max-w-xs min-w-0 px-1'>
        <input
          type='range'
          min={MATRIX_SIZE_MIN}
          max={MATRIX_SIZE_MAX}
          step={MATRIX_SIZE_STEP}
          value={value}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
          className='h-8 w-full cursor-pointer accent-blue-500 dark:accent-blue-400'
          aria-labelledby={labelId}
        />
      </div>
    </div>
  );
}

export default function RelationsClient({ description }: RelationsClientProps) {
  const [isDarkMode] = useDarkMode();
  const { role: userRole } = useUser();
  const { isEditMode, exitEditMode } = useSearchParamEditMode();
  const { info } = useToast();
  const charactersSnapshot = useSnapshot(characters);
  const [rowFaction, setRowFaction] = useState<RelationMatrixRowFaction>('mouse');
  const [columnCategory, setColumnCategory] = useState<RelationMatrixColumnCategory>('cat');
  const [matrixSize, setMatrixSize] = useState(DEFAULT_MATRIX_SIZE);
  const [selectedCell, setSelectedCell] = useState<RelationMatrixCellSelection | null>(null);
  const {
    isDirty,
    isPublishing,
    draftInfo,
    draftsSummary,
    discardChanges,
    publishChanges,
    getActionCount,
  } = useRelationMatrixEditMode();
  const canEditRelations = userRole !== null && RELATION_EDIT_ROLES.has(userRole);
  const isRelationEditMode = isEditMode && canEditRelations;
  const coercedColumnCategory = coerceColumnCategory(rowFaction, columnCategory);
  const columnCategoryOptions = getLegalColumnCategories(rowFaction);
  const viewModel = useMemo(
    () =>
      buildRelationMatrixViewModel({
        rowFaction,
        columnCategory: coercedColumnCategory,
        getRelationsForRow: isRelationEditMode
          ? (characterId) =>
              getEditableCharacterRelations(characterId, charactersSnapshot[characterId])
          : (characterId) => getCharacterRelation(characters, characterId),
      }),
    [charactersSnapshot, coercedColumnCategory, isRelationEditMode, rowFaction]
  );
  const actionCount = getActionCount();

  useEffect(() => {
    if (!isEditMode || canEditRelations) return;

    exitEditMode();
    info('您没有权限编辑角色关系');
  }, [canEditRelations, exitEditMode, info, isEditMode]);

  useEffect(() => {
    if (isRelationEditMode) return;

    setSelectedCell(null);
  }, [isRelationEditMode]);

  const handleEditorOpenChange = useCallback((open: boolean) => {
    if (open) return;

    setSelectedCell(null);
  }, []);

  const handleCellSelect = useCallback((selection: RelationMatrixCellSelection) => {
    setSelectedCell(selection);
  }, []);

  const handleExitEditMode = useCallback(() => {
    setSelectedCell(null);
    exitEditMode();
  }, [exitEditMode]);

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
      actions={canEditRelations && !isEditMode ? <EditButton /> : undefined}
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
          <MatrixSizeSlider value={matrixSize} onChange={setMatrixSize} />
          <RelationMatrixLegend />
        </div>
      }
      filtersClassName='max-w-5xl'
    >
      <CharacterRelationsMatrix
        viewModel={viewModel}
        cellSize={matrixSize}
        isEditMode={isRelationEditMode}
        {...(isRelationEditMode ? { onCellSelect: handleCellSelect } : {})}
      />
      {isRelationEditMode ? (
        <>
          <RelationMatrixCellEditor
            open={selectedCell !== null}
            selection={selectedCell}
            columnCategory={coercedColumnCategory}
            onOpenChange={handleEditorOpenChange}
          />
          <EditModeToolbar
            isDirty={isDirty}
            actionCount={actionCount}
            draftInfo={draftInfo}
            draftsSummary={draftsSummary}
            isPublishing={isPublishing}
            onDiscard={discardChanges}
            onPublish={publishChanges}
            onExitEditMode={handleExitEditMode}
            entityName='角色关系'
          />
        </>
      ) : null}
    </CatalogPageShell>
  );
}
