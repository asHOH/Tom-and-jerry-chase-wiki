'use client';

import React from 'react';
import Image from '@/components/Image';

interface Character {
  id: string;
  imageUrl?: string;
}

interface CharacterListProps {
  characters: Character[];
  isMinorCharacters?: Character[];
  showList?: boolean;
  color?: 'default' | 'red' | 'blue' | 'green';
}

const classNameColors: Record<string, string> = {
  default: '',
  red: 'bg-red-50 dark:bg-red-900/30',
  blue: 'bg-blue-50 dark:bg-blue-900/30',
  green: 'bg-green-50 dark:bg-green-900/30',
};

export default function AdviceCharacterList({
  characters = [],
  isMinorCharacters = [],
  showList = true,
  color = 'default',
}: CharacterListProps) {
  if (!showList) {
    return null;
  }
  const useSmallGrid = characters.length + isMinorCharacters.length <= 8;

  return (
    <div className='rounded-xl bg-white dark:bg-slate-800 shadow-sm px-2 py-3'>
      <ul
        className='gap-4'
        style={{
          display: 'grid',
          gridTemplateColumns: useSmallGrid
            ? 'repeat(auto-fit, minmax(175px, 0.5fr))'
            : 'repeat(auto-fit, minmax(65px, 0.2fr))',
        }}
      >
        {characters.map((character) => (
          <li
            key={character.id ?? ''}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:-translate-y-1 ${classNameColors[color]}`}
          >
            <a
              href={`/characters/${character.id}`}
              className='flex items-center gap-2 w-full'
              tabIndex={0}
            >
              <Image
                src={character.imageUrl!}
                alt={character.id!}
                className='w-12 h-12'
                width={90}
                height={90}
              />
              {useSmallGrid && (
                <span className='text-lg dark:text-white truncate'>{character.id}</span>
              )}
            </a>
          </li>
        ))}
        {isMinorCharacters.map((character) => (
          <li
            key={character.id ?? ''}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:-translate-y-1 opacity-60 ${classNameColors[color]}`}
          >
            <a
              href={`/characters/${character.id}`}
              className='flex items-center gap-2 w-full opacity-80'
              tabIndex={0}
            >
              <Image
                src={character.imageUrl!}
                alt={character.id!}
                className='w-10 h-10'
                width={40}
                height={40}
              />
              <span className='text-lg dark:text-white truncate'>{character.id}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
