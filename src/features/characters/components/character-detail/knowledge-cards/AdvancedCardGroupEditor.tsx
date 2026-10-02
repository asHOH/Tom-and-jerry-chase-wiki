'use client';

import { useEffect, useMemo, useState } from 'react';
import isEqual from 'lodash-es/isEqual';

import { cn } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import type { CardGroup, CardGroupType, FactionId } from '@/data/types';
import {
  getKnowledgeCardGroupCostRange,
  isKnowledgeCardGroupCostValid,
  KNOWLEDGE_CARD_GROUP_COST_MESSAGE,
} from '@/features/knowledge-cards/utils/groupCostValidation';
import {
  appendToPath,
  changeGroupType,
  cloneCardGroup,
  removeNodeAtPath,
  unwrapGroup,
  wouldExceedDepth,
} from '@/features/knowledge-cards/utils/treeEditorUtils';
import { BaseDialog } from '@/components/ui/BaseDialog';
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
    if (isSaveBlocked) return;
    onSave(cards);
    onClose();
  };

  const costRange = useMemo(
    () => getKnowledgeCardGroupCostRange(cards, getCardCost),
    [cards, getCardCost]
  );
  const isSaveBlocked = !isEqual(cards, initialCards) && !isKnowledgeCardGroupCostValid(costRange);

  return (
    <>
      <BaseDialog
        open={isOpen && !isSubPickerOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        ariaLabel='高级编辑知识卡组'
        backdropClassName='z-10000'
        panelClassName={cn(
          'z-10001 flex flex-col',
          isMobile
            ? 'inset-0 h-full w-full rounded-none'
            : 'inset-auto top-1/2 left-1/2 max-h-[85vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2'
        )}
      >
        {/* Header */}
        <div className='border-border flex-none border-b p-4 sm:p-6'>
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
        <div className='border-border flex-none border-t p-4 sm:p-6'>
          <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
            <div className='text-sm text-gray-600 dark:text-gray-400'>
              <span className='font-bold'>
                当前知识量:{' '}
                {Number.isFinite(costRange.min) && Number.isFinite(costRange.max)
                  ? costRange.min === costRange.max
                    ? costRange.max
                    : `${costRange.min}-${costRange.max}`
                  : '无有效组合'}
              </span>
              {costRange.max > 21 && (
                <span className='ml-2 text-red-500 dark:text-red-400'>(超出限制!)</span>
              )}
              {costRange.max === 21 && (
                <span className='ml-2 text-amber-500 dark:text-amber-400'>(需开启+1上限)</span>
              )}
              {isSaveBlocked && (
                <p role='alert' className='mt-1 text-red-500 dark:text-red-400'>
                  {KNOWLEDGE_CARD_GROUP_COST_MESSAGE}
                </p>
              )}
            </div>
            <div className='flex w-full shrink-0 justify-end gap-2 sm:w-auto'>
              <Button onClick={onClose} variant='secondary'>
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSaveBlocked}>
                保存
              </Button>
            </div>
          </div>
        </div>
      </BaseDialog>

      {/* Sub-picker for adding cards (renders above the editor) */}
      <KnowledgeCardPicker
        isOpen={isOpen && isSubPickerOpen}
        onClose={() => {
          setSubPickerOpen(false);
          setAddCardTargetPath(null);
        }}
        onSave={handleSubPickerSave}
        factionId={factionId}
        initialSelectedCards={[]}
        validateGroupCost={false}
      />
    </>
  );
}
