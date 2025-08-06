'use client';

import React, { useState } from 'react';
import { cards } from '@/data';
import Image from 'next/image';
import { CharacterRelationItem } from '@/data/types';

type Props = {
  selected: CharacterRelationItem[];
  onSelect: (cardName: string) => void;
  factionId: 'cat' | 'mouse';
};

const KnowledgeCardSelector: React.FC<Props> = ({ selected, onSelect, factionId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const availableCards = Object.values(cards).filter(
    ({ id, factionId: rawFactionId }) =>
      !selected.some((selection) => selection.id == id) && rawFactionId === factionId
  );

  const handleSelect = (cardName: string) => {
    onSelect(cardName);
    setIsOpen(false);
  };

  if (availableCards.length === 0) {
    return null;
  }

  return (
    <div className='relative inline-block'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
        aria-label='添加知识卡'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
          className='w-4 h-4'
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
        </svg>
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto'>
          {availableCards.map(({ id: name, imageUrl }) => (
            <button
              key={name}
              type='button'
              onClick={() => handleSelect(name)}
              className='w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
              aria-label={`选择知识卡 ${name}`}
            >
              {imageUrl && (
                <Image src={imageUrl} alt={name} width={20} height={20} className='w-5 h-5' />
              )}
              <span className='text-gray-700 dark:text-gray-300'>{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default KnowledgeCardSelector;
