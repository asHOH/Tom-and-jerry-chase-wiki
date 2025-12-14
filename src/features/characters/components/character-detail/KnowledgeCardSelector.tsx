'use client';

import React, { useState } from 'react';

import { CharacterRelationItem } from '@/data/types';
import { PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { cards } from '@/data';

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
        className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
        aria-label='添加知识卡'
      >
        <PlusIcon className='h-4 w-4' aria-hidden='true' />
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 z-50 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800'>
          {availableCards.map(({ id: name, imageUrl }) => (
            <button
              key={name}
              type='button'
              onClick={() => handleSelect(name)}
              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
              aria-label={`选择知识卡 ${name}`}
            >
              {imageUrl && (
                <Image src={imageUrl} alt={name} width={20} height={20} className='h-5 w-5' />
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
