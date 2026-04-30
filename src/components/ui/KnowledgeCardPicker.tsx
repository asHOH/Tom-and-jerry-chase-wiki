'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { Card, FactionId } from '@/data/types';
import { catKnowledgeCards } from '@/features/knowledge-cards/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/features/knowledge-cards/data/mouseKnowledgeCards';
import Image from '@/components/Image';

import Tooltip from './Tooltip';

interface KnowledgeCardPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newCards: readonly string[]) => void;
  factionId: FactionId;
  initialSelectedCards: readonly string[];
}

let scrollLockCount = 0;
let previousOverflow: string | null = null;

function lockBodyScroll() {
  if (typeof document === 'undefined') return;
  scrollLockCount += 1;
  if (scrollLockCount !== 1) return;

  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return;
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount !== 0) return;

  document.body.style.overflow = previousOverflow ?? '';
  previousOverflow = null;
}

const KnowledgeCardPicker: React.FC<KnowledgeCardPickerProps> = ({
  isOpen,
  onClose,
  onSave,
  factionId,
  initialSelectedCards,
}) => {
  const [selectedCards, setSelectedCards] = useState<readonly string[]>(initialSelectedCards);
  const isMobile = useMobile();

  useEffect(() => {
    setSelectedCards(initialSelectedCards);
  }, [initialSelectedCards, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

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

  const pickerClasses = isMobile
    ? 'w-full h-full rounded-none'
    : 'w-full max-w-3xl max-h-[80vh] rounded-lg';

  const content = (
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
            'relative flex flex-col bg-white p-6 shadow-2xl dark:bg-slate-800',
            pickerClasses
          )}
          onClick={(e) => e.stopPropagation()}
          role='dialog'
          aria-modal='true'
          aria-label='选择知识卡'
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
            <div className='flex w-full sm:w-auto'>
              <button
                onClick={onClose}
                className='mr-2 flex-1 rounded bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400 sm:flex-none dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500'
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className='flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 sm:flex-none dark:bg-blue-600 dark:hover:bg-blue-700'
              >
                保存
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};

export default KnowledgeCardPicker;
