'use client';

import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/design';
import type { TraitRelationKind } from '@/data/types';
import {
  removeCharacterRelationItemFromKinds,
  upsertCharacterRelationItem,
} from '@/features/characters/utils/characterRelationOverlay';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';

import type { RelationMatrixCellSelection } from './CharacterRelationsMatrix';
import {
  getInverseCharacterRelationKind,
  getLegalRelationKinds,
  getRelationKindLabel,
  getSiblingRelationKinds,
} from './relationMatrixEditing';
import type { RelationMatrixColumnCategory } from './relationMatrixViewModel';

type RelationMatrixCellEditorProps = {
  open: boolean;
  selection: RelationMatrixCellSelection | null;
  columnCategory: RelationMatrixColumnCategory;
  onOpenChange: (open: boolean) => void;
};

const getInitialRelationKind = (
  selection: RelationMatrixCellSelection,
  legalKinds: readonly TraitRelationKind[]
): TraitRelationKind | '' => {
  const sourceKind = selection.cell?.sourceKind;
  if (sourceKind && legalKinds.includes(sourceKind)) return sourceKind;
  if (legalKinds.length === 1) return legalKinds[0]!;
  return '';
};

const toInverseRelationKinds = (legalKinds: readonly TraitRelationKind[]): TraitRelationKind[] => {
  const inverseKinds: TraitRelationKind[] = [];
  legalKinds.forEach((kind) => {
    const inverseKind = getInverseCharacterRelationKind(kind);
    if (inverseKind) inverseKinds.push(inverseKind);
  });
  return inverseKinds;
};

export default function RelationMatrixCellEditor({
  open,
  selection,
  columnCategory,
  onOpenChange,
}: RelationMatrixCellEditorProps) {
  const legalKinds = useMemo(
    () => (selection ? getLegalRelationKinds(selection.row, selection.column, columnCategory) : []),
    [columnCategory, selection]
  );
  const [selectedKind, setSelectedKind] = useState<TraitRelationKind | ''>('');
  const [description, setDescription] = useState('');
  const [isMinor, setIsMinor] = useState(false);

  useEffect(() => {
    if (!selection || !open) return;

    setSelectedKind(getInitialRelationKind(selection, legalKinds));
    setDescription(selection.cell?.description ?? '');
    setIsMinor(!!selection.cell?.isMinor);
  }, [legalKinds, open, selection]);

  if (!selection) {
    return null;
  }

  const isCharacterTarget = selection.column.type === 'character';
  const canSave = selectedKind !== '';

  const handleSave = () => {
    if (!selectedKind) return;

    const trimmedDescription = description.trim();
    const item = {
      id: selection.column.id,
      description: trimmedDescription,
      isMinor,
    };

    removeCharacterRelationItemFromKinds(
      selection.row.id,
      getSiblingRelationKinds(selectedKind, legalKinds),
      selection.column.id
    );

    if (isCharacterTarget) {
      const inverseSelectedKind = getInverseCharacterRelationKind(selectedKind);
      if (inverseSelectedKind) {
        removeCharacterRelationItemFromKinds(
          selection.column.id,
          getSiblingRelationKinds(inverseSelectedKind, toInverseRelationKinds(legalKinds)),
          selection.row.id
        );
      }
    }

    upsertCharacterRelationItem(selection.row.id, selectedKind, item);

    if (isCharacterTarget) {
      const inverseSelectedKind = getInverseCharacterRelationKind(selectedKind);
      if (inverseSelectedKind) {
        upsertCharacterRelationItem(selection.column.id, inverseSelectedKind, {
          id: selection.row.id,
          description: trimmedDescription,
          isMinor,
        });
      }
    }

    onOpenChange(false);
  };

  const handleRemove = () => {
    removeCharacterRelationItemFromKinds(selection.row.id, legalKinds, selection.column.id);

    if (isCharacterTarget) {
      removeCharacterRelationItemFromKinds(
        selection.column.id,
        toInverseRelationKinds(legalKinds),
        selection.row.id
      );
    }

    onOpenChange(false);
  };

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel='编辑角色关系'
      panelClassName='flex max-h-[min(90vh,36rem)] w-[min(92vw,32rem)] flex-col overflow-hidden'
    >
      <div className='flex flex-col gap-4 overflow-y-auto p-4'>
        <div>
          <h2 className='text-base font-semibold text-gray-900 dark:text-white'>编辑角色关系</h2>
          <p className='mt-1 text-sm text-gray-600 dark:text-gray-300'>
            {selection.row.label} 与 {selection.column.label}
          </p>
        </div>

        {legalKinds.length > 1 ? (
          <label className='flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200'>
            关系类型
            <select
              value={selectedKind}
              onChange={(event) => setSelectedKind(event.currentTarget.value as TraitRelationKind)}
              className='rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white'
            >
              <option value=''>请选择关系类型</option>
              {legalKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {getRelationKindLabel(kind)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className='text-sm text-gray-700 dark:text-gray-200'>
            关系类型：{selectedKind ? getRelationKindLabel(selectedKind) : '不可编辑'}
          </div>
        )}

        <div className='flex items-center gap-2' role='group' aria-label='关系强度'>
          {[
            { value: false, label: '主要' },
            { value: true, label: '次要' },
          ].map((option) => (
            <button
              key={option.label}
              type='button'
              aria-pressed={isMinor === option.value}
              onClick={() => setIsMinor(option.value)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
                isMinor === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className='flex flex-col gap-1 text-sm font-medium text-gray-700 dark:text-gray-200'>
          说明
          <textarea
            value={description}
            onChange={(event) => setDescription(event.currentTarget.value)}
            rows={4}
            className='resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white'
          />
        </label>
      </div>

      <div className='flex items-center justify-between border-t border-gray-200 p-4 dark:border-slate-700'>
        <Button variant='danger' size='sm' onClick={handleRemove}>
          移除
        </Button>
        <div className='flex items-center gap-2'>
          <Button variant='secondary' size='sm' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant='primary' size='sm' disabled={!canSave} onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
}
