'use client';

import React from 'react';
import Image from '@/components/Image';

interface Character {
  id: string;
  imageUrl?: string;
}

interface CharacterListProps {
  characters: Character[];
  showList: boolean;
}

export default function CharacterList({ characters, showList }: CharacterListProps) {
  if (!showList) {
    return null;
  }

  return (
    <div className='rounded-xl bg-white dark:bg-slate-800 shadow-sm px-2 py-3'>
      <ul
        className='gap-1'
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
        }}
      >
        {characters.map((character) => (
          <li
            key={character.id ?? ''}
            className='flex items-center gap-3 p-3 rounded-lg transition-colors'
          >
            <a
              href={`/characters/${character.id}`}
              className='flex items-center gap-2 w-full'
              tabIndex={0}
            >
              <Image
                src={character.imageUrl!}
                alt={character.id!}
                className='w-16 h-16'
                width={64}
                height={64}
              />
              <span className='text-lg dark:text-white truncate'>{character.id}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
