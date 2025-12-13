'use client';

import Image from '@/components/Image';
import Link from '@/components/Link';

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
    <div className='rounded-xl bg-white px-2 py-3 shadow-sm dark:bg-slate-800'>
      <ul className='grid [grid-template-columns:repeat(auto-fit,minmax(175px,1fr))] gap-1'>
        {characters.map((character) => (
          <li
            key={character.id ?? ''}
            className='flex items-center rounded-lg p-2 transition-colors'
          >
            <Link
              href={`/characters/${character.id}`}
              className='flex w-full items-center gap-2 rounded-lg duration-300 hover:bg-slate-100 lg:px-0.5 dark:hover:bg-slate-700/60'
              tabIndex={0}
            >
              <div className='relative flex h-16 w-16 flex-shrink-0 items-center justify-center'>
                {character.imageUrl ? (
                  <Image
                    src={character.imageUrl}
                    alt={character.id}
                    fill
                    sizes='64px'
                    className='object-contain'
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <span className='text-xs text-slate-500 dark:text-slate-300'>无图</span>
                )}
              </div>
              <span className='truncate text-lg dark:text-white'>{character.id}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
