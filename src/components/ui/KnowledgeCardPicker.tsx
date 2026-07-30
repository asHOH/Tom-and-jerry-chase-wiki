'use client';

import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { Card, FactionId } from '@/data/types';
import { catKnowledgeCards } from '@/features/knowledge-cards/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/features/knowledge-cards/data/mouseKnowledgeCards';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import Image from '@/components/Image';

import Tooltip from './Tooltip';

interface KnowledgeCardPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newCards: readonly string[]) => void;
  factionId: FactionId;
  initialSelectedCards: readonly string[];
  onSwitchToAdvancedEditor?: (selectedCards: readonly string[]) => void;
}

const KnowledgeCardPicker: React.FC<KnowledgeCardPickerProps> = ({
  isOpen,
  onClose,
  onSave,
  factionId,
  initialSelectedCards,
  onSwitchToAdvancedEditor,
}) => {
  const [selectedCards, setSelectedCards] = useState<readonly string[]>(initialSelectedCards);
  const isMobile = useMobile();

  useEffect(() => {
    setSelectedCards(initialSelectedCards);
  }, [initialSelectedCards, isOpen]);

  const allCards = factionId === 'cat' ? catKnowledgeCards : mouseKnowledgeCards;
  const imageBasePath = factionId === 'cat' ? '/images/catCards/' : '/images/mouseCards/';

  const handleCardClick = (cardId: string) => {
    setSelectedCards((prev) =>
      prev.includes(cardId) ? prev.filter((c) => c !== cardId) : [...prev, cardId]
    );
  };

  const handleSave = () => {
    onSave(selectedCards);
    onClose();
  };

  const getCardCost = (cardId: string) => {
    const cardName = cardId.split('-')[1];
    if (!cardName) return 0;
    const cardData = allCards[cardName];
    return cardData?.cost ?? 0;
  };

  const totalCost = selectedCards.reduce((sum, cardId) => sum + getCardCost(cardId), 0);

  return (
    <BaseDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      ariaLabel='选择知识卡'
      backdropClassName='z-10000'
      panelClassName={cn(
        'z-10001 flex flex-col p-6',
        isMobile
          ? 'inset-0 h-full w-full rounded-none'
          : 'inset-auto top-1/2 left-1/2 max-h-[80vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2'
      )}
    >
      <h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>选择知识卡</h2>
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <div className='grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7'>
          {Object.values(allCards).map((card: Card) => {
            const cardIdWithRank = `${card.rank}-${card.id}`;
            const isSelected = selectedCards.includes(cardIdWithRank);
            return (
              <Tooltip key={card.id} content={`${card.id} (${card.cost}费)`}>
                <div
                  onClick={() => handleCardClick(cardIdWithRank)}
                  className={cn(
                    'relative aspect-square w-full cursor-pointer rounded-lg border-4 transition-all duration-200',
                    isSelected
                      ? 'scale-105 border-blue-500 dark:border-blue-400'
                      : 'border-transparent'
                  )}
                >
                  <Image
                    src={`${imageBasePath}${cardIdWithRank}.png`}
                    alt={cardIdWithRank}
                    fill
                    className='object-contain'
                  />
                  {isSelected && (
                    <div className='absolute top-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-lg font-bold text-white'>
                      ✓
                    </div>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
      <div className='mt-4 flex flex-none flex-col items-center justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row dark:border-slate-700'>
        <div className='text-center text-gray-800 sm:text-left dark:text-gray-200'>
          <span className='font-bold'>总知识量: {totalCost}</span>
          {totalCost > 21 && (
            <span className='ml-2 text-red-500 dark:text-red-400'>(超出限制!)</span>
          )}
          {totalCost === 21 && (
            <span className='ml-2 text-amber-500 dark:text-amber-400'>(需开启+1上限)</span>
          )}
        </div>
        <div className='flex w-full items-center gap-2 sm:w-auto'>
          {onSwitchToAdvancedEditor && (
            <Button
              onClick={() => onSwitchToAdvancedEditor(selectedCards)}
              variant='secondary'
              className='flex-1 sm:flex-none'
            >
              切换到高级编辑
            </Button>
          )}
          <Button onClick={onClose} variant='secondary' className='mr-2 flex-1 sm:flex-none'>
            取消
          </Button>
          <Button onClick={handleSave} className='flex-1 sm:flex-none'>
            保存
          </Button>
        </div>
      </div>
    </BaseDialog>
  );
};

export default KnowledgeCardPicker;
