'use client';

import React, { useState } from 'react';
import { FactionId, specialSkills } from '@/data';
import Image from '@/components/Image';
import { CharacterRelationItem } from '@/data/types';
import { PlusIcon } from '@/components/icons/CommonIcons';

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
        className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
        aria-label='添加特技'
      >
        <PlusIcon className='w-4 h-4' aria-hidden='true' />
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto'>
          {availableSkills.map((name) => (
            <button
              key={name}
              type='button'
              onClick={() => handleSelect(name)}
              className='w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
              aria-label={`选择特技 ${name}`}
            >
              {specialSkills[oppositeFaction][name]?.imageUrl && (
                <Image
                  src={specialSkills[oppositeFaction][name].imageUrl}
                  alt={name}
                  width={20}
                  height={20}
                  className='w-5 h-5 rounded-full object-cover'
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
