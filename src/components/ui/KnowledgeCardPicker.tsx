'use client';

import React, { useState, useEffect } from 'react';
import { catKnowledgeCards } from '@/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/data/mouseKnowledgeCards';
import { Card, FactionId } from '@/data/types';
import Image from '@/components/Image';
import Tooltip from './Tooltip';
import { useMobile } from '@/hooks/useMediaQuery';
import clsx from 'clsx';

interface KnowledgeCardPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newCards: readonly string[]) => void;
  factionId: FactionId;
  initialSelectedCards: readonly string[];
}

// TODO: allow to change card descriptions
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

  if (!isOpen) return null;

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

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50'>
      <div
        className={clsx('bg-white dark:bg-slate-800 p-6 shadow-xl flex flex-col', pickerClasses)}
      >
        <h2 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>选择知识卡</h2>
        <div className='flex-grow overflow-y-auto'>
          <div className='grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-4'>
            {Object.values(allCards).map((card: Card) => {
              const cardIdWithRank = `${card.rank}-${card.id}`;
              const isSelected = selectedCards.includes(cardIdWithRank);
              return (
                <Tooltip key={card.id} content={`${card.id} (${card.cost}费)`}>
                  <div
                    onClick={() => handleCardClick(cardIdWithRank)}
                    className={clsx(
                      'relative w-full aspect-square cursor-pointer border-4 rounded-lg transition-all duration-200',
                      isSelected
                        ? 'border-blue-500 dark:border-blue-400 scale-105'
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
                      <div className='absolute top-0 right-0 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg font-bold'>
                        ✓
                      </div>
                    )}
                  </div>
                </Tooltip>
              );
            })}
          </div>
        </div>
        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4'>
          <div className='text-center sm:text-left text-gray-800 dark:text-gray-200'>
            <span className='font-bold'>总知识量: {totalCost}</span>
            {totalCost > 21 && (
              <span className='text-red-500 dark:text-red-400 ml-2'>(超出限制!)</span>
            )}
            {totalCost === 21 && (
              <span className='text-amber-500 dark:text-amber-400 ml-2'>(需开启+1上限)</span>
            )}
          </div>
          <div className='flex w-full sm:w-auto'>
            <button
              onClick={onClose}
              className='flex-1 sm:flex-none px-4 py-2 mr-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500'
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className='flex-1 sm:flex-none px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCardPicker;
