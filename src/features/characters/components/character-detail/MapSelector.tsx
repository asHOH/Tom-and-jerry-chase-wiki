'use client';

import React, { useState } from 'react';
import { useSnapshot } from 'valtio';

import { mapsEdit } from '@/data/store';
import { CharacterRelationItem } from '@/data/types';
import { PlusIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

type Props = {
  selected: CharacterRelationItem[];
  onSelect: (mapName: string) => void;
  disabled?: boolean;
};

const MapSelector: React.FC<Props> = ({ selected, onSelect, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const mapsSnapshot = useSnapshot(mapsEdit);

  const availableMaps = Object.values(mapsSnapshot).filter(
    ({ name }) => !selected.some((selection) => selection.id === name)
  );

  const handleSelect = (mapName: string) => {
    onSelect(mapName);
    setIsOpen(false);
  };

  if (availableMaps.length === 0) {
    return null;
  }

  return (
    <div className='relative inline-block'>
      <button
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className='flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-xs text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-700'
        aria-label='添加地图'
        disabled={disabled}
      >
        <PlusIcon className='h-4 w-4' aria-hidden='true' />
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 z-50 mt-1 max-h-48 w-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800'>
          {availableMaps.map(({ name, imageUrl }) => (
            <button
              key={name}
              type='button'
              onClick={() => handleSelect(name)}
              className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700'
              aria-label={`选择地图 ${name}`}
            >
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={20}
                  height={20}
                  className='h-5 w-5 rounded'
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

export default MapSelector;
