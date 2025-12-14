'use client';

import React, { useState } from 'react';

import { CharacterRelationItem } from '@/data/types';
import { PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { FactionId, specialSkills } from '@/data';

type Props = {
  selected: CharacterRelationItem[];
  factionId: FactionId;
  onSelect: (skillName: string) => void;
};

const SpecialSkillSelector: React.FC<Props> = ({ selected, factionId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const oppositeFaction: FactionId = factionId === 'cat' ? 'mouse' : 'cat';

  const availableSkills = Object.keys(specialSkills[oppositeFaction]).filter(
    (name) => !selected.some((selection) => selection.id == name)
  );

  const handleSelect = (skillName: string) => {
    onSelect(skillName);
    setIsOpen(false);
  };

  if (availableSkills.length === 0) {
    return null;
  }

  return (
    <div className='relative inline-block'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
        aria-label='添加特技'
      >
        <PlusIcon className='h-4 w-4' aria-hidden='true' />
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 z-50 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800'>
          {availableSkills.map((name) => (
            <button
              key={name}
              type='button'
              onClick={() => handleSelect(name)}
              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
              aria-label={`选择特技 ${name}`}
            >
              {specialSkills[oppositeFaction][name]?.imageUrl && (
                <Image
                  src={specialSkills[oppositeFaction][name].imageUrl}
                  alt={name}
                  width={20}
                  height={20}
                  className='h-5 w-5 rounded-full object-cover'
                />
              )}
              <span className='text-gray-700 dark:text-gray-300'>{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialSkillSelector;
