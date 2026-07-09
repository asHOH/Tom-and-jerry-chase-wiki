'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import type { CardGroup, CardGroupType, FactionId } from '@/data/types';
import { calculateMaxCostForTree } from '@/features/knowledge-cards/utils/sections';
import {
  appendToPath,
  changeGroupType,
  cloneCardGroup,
  removeNodeAtPath,
  unwrapGroup,
  wouldExceedDepth,
} from '@/features/knowledge-cards/utils/treeEditorUtils';
import Button from '@/components/ui/Button';
import KnowledgeCardPicker from '@/components/ui/KnowledgeCardPicker';

import EditableTreeNode from './EditableTreeNode';

interface AdvancedCardGroupEditorProps {
  isOpen: boolean;
  initialCards: readonly CardGroup[];
  factionId: FactionId;
  getCardCost: (cardId: string) => number;
  imageBasePath: string;
  onClose: () => void;
  onSave: (newCards: CardGroup[]) => void;
}

/** Modal dialog for editing the CardGroup[] tree structure. */
export default function AdvancedCardGroupEditor({
  isOpen,
  initialCards,
  factionId,
  getCardCost,
  imageBasePath,
  onClose,
  onSave,
}: AdvancedCardGroupEditorProps) {
  const [cards, setCards] = useState<CardGroup[]>(() => cloneCardGroup(initialCards));
  const [addCardTargetPath, setAddCardTargetPath] = useState<number[] | null>(null);
  const [isSubPickerOpen, setSubPickerOpen] = useState(false);
  const isMobile = useMobile();

  // Reset state when opening with new cards
  useEffect(() => {
    if (isOpen) {
      setCards(cloneCardGroup(initialCards));
      setAddCardTargetPath(null);
      setSubPickerOpen(false);
    }
  }, [isOpen, initialCards]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubPickerOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isSubPickerOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  const handleDeleteNode = (path: number[]) => {
    setCards((prev) => removeNodeAtPath(prev, path));
  };

  const handleRequestAddCard = (parentPath: number[]) => {
    setAddCardTargetPath(parentPath);
    setSubPickerOpen(true);
  };

  const handleAddGroup = (parentPath: number[], groupType: CardGroupType) => {
    if (wouldExceedDepth(cards, parentPath)) return;
    setCards((prev) => appendToPath(prev, parentPath, [groupType] as unknown as CardGroup));
  };

  const handleToggleGroupType = (path: number[], newType: CardGroupType) => {
    setCards((prev) => changeGroupType(prev, path, newType));
  };

  const handleUnwrapGroup = (path: number[]) => {
    setCards((prev) => unwrapGroup(prev, path));
  };

  const handleSubPickerSave = (selectedCards: readonly string[]) => {
    if (!addCardTargetPath) return;

    let newCards = cards;
    for (const cardId of selectedCards) {
      newCards = appendToPath(newCards, addCardTargetPath, cardId as unknown as CardGroup);
    }
    setCards(newCards);
    setAddCardTargetPath(null);
    setSubPickerOpen(false);
  };

  const handleSave = () => {
    onSave(cards);
    onClose();
  };

  const maxCost = useMemo(() => calculateMaxCostForTree(cards, getCardCost), [cards, getCardCost]);

  if (!isOpen || typeof document === 'undefined') return null;

  const pickerClasses = isMobile
    ? 'w-full h-full rounded-none'
    : 'w-full max-w-4xl max-h-[85vh] rounded-lg';

  const content = (
    <>
      {!isSubPickerOpen && (
        <>
          {/* Backdrop */}
          <div
            className='fixed inset-0 z-10000 bg-black/40 backdrop-blur-sm'
            aria-hidden='true'
            onClick={onClose}
          />

          {/* Dialog Panel */}
          <div className='fixed inset-0 z-10001 flex items-center justify-center p-4'>
            <div
              className={cn(
                'relative flex flex-col bg-white shadow-2xl dark:bg-slate-800',
                pickerClasses
              )}
              onClick={(e) => e.stopPropagation()}
              role='dialog'
              aria-modal='true'
              aria-label='高级编辑知识卡组'
            >
              {/* Header */}
              <div className='flex-none border-b border-gray-200 p-4 sm:p-6 dark:border-slate-700'>
                <h2 className='text-xl font-bold text-gray-900 sm:text-2xl dark:text-white'>
                  高级编辑知识卡组
                </h2>
              </div>

              {/* Tree editor area */}
              <div className='min-h-0 flex-1 overflow-y-auto p-4 sm:p-6'>
                <EditableTreeNode
                  cards={cards}
                  parentPath={[]}
                  depth={0}
                  imageBasePath={imageBasePath}
                  onDeleteNode={handleDeleteNode}
                  onRequestAddCard={handleRequestAddCard}
                  onAddGroup={handleAddGroup}
                  onToggleGroupType={handleToggleGroupType}
                  onUnwrapGroup={handleUnwrapGroup}
                />
              </div>

              {/* Footer */}
              <div className='flex-none border-t border-gray-200 p-4 sm:p-6 dark:border-slate-700'>
                <div className='flex items-center justify-between'>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    <span className='font-bold'>当前最大知识量: {maxCost}</span>
                    {maxCost > 21 && (
                      <span className='ml-2 text-red-500 dark:text-red-400'>(超出限制!)</span>
                    )}
                    {maxCost === 21 && (
                      <span className='ml-2 text-amber-500 dark:text-amber-400'>
                        (需开启+1上限)
                      </span>
                    )}
                  </div>
                  <div className='flex gap-2'>
                    <Button onClick={onClose} variant='secondary'>
                      取消
                    </Button>
                    <Button onClick={handleSave}>保存</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sub-picker for adding cards (renders above the editor) */}
      <KnowledgeCardPicker
        isOpen={isSubPickerOpen}
        onClose={() => {
          setSubPickerOpen(false);
          setAddCardTargetPath(null);
        }}
        onSave={handleSubPickerSave}
        factionId={factionId}
        initialSelectedCards={[]}
      />
    </>
  );

  return createPortal(content, document.body);
}
