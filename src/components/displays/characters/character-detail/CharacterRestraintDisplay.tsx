// 'use client';

import React from 'react';
import Image from 'next/image';
import { FactionId } from '@/data';
import { getCatImageUrl } from '@/data/catCharacters';
import { getMouseImageUrl } from '@/data/mouseCharacters';
import { CharacterRestraint } from '@/data/types';
type Props = {
  id: string;
  factionId: FactionId;
};

import { characters } from '@/data';

function getCharacterRestraint(id: string): CharacterRestraint {
  // If the character is in the other characters' counters or counteredBy, it should be included
  const char = characters[id];
  if (!char) {
    return {
      counters: [],
      counteredBy: [],
    };
  }

  const counteredBy = Object.values(characters)
    .filter((c) => c.counters?.some((counter) => counter.id === id))
    .map((c) => {
      const restraintItem = c.counters?.find((counter) => counter.id === id);
      if (restraintItem && typeof restraintItem.description === 'string') {
        return { id: c.id, description: restraintItem.description };
      }
      return { id: c.id };
    });

  const counters = Object.values(characters)
    .filter((c) => c.counteredBy?.some((countered) => countered.id === id))
    .map((c) => {
      const restraintItem = c.counteredBy?.find((countered) => countered.id === id);
      if (restraintItem && typeof restraintItem.description === 'string') {
        return { id: c.id, description: restraintItem.description };
      }
      return { id: c.id };
    });

  const ownCounters = char.counters ?? [];
  const ownCounteredBy = char.counteredBy ?? [];

  const mergedCounters = [
    ...ownCounters,
    ...counters.filter((c) => !ownCounters.some((oc) => oc.id === c.id)),
  ];
  const mergedCounteredBy = [
    ...ownCounteredBy,
    ...counteredBy.filter((c) => !ownCounteredBy.some((oc) => oc.id === c.id)),
  ];

  return {
    counters: mergedCounters,
    counteredBy: mergedCounteredBy,
  };
}

const CharacterRestraintDisplay: React.FC<Props> = ({ id, factionId }) => {
  const getImageUrl = factionId == 'cat' ? getMouseImageUrl : getCatImageUrl;
  const char = getCharacterRestraint(id);
  return (
    <div className='flex gap-6 items-start bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg shadow'>
      {/* Relationships */}
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <span className='font-semibold text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1'>
            <span className='w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center mr-1'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
                aria-label='sword'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M2 14L14 2M10 2L14 2L14 6'
                  stroke='#2563eb'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
                <rect x='1.5' y='13.5' width='3' height='1' rx='0.5' fill='#2563eb' />
              </svg>
            </span>
            克制对象
          </span>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counters.length === 0 ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              char.counters.map((c) => (
                <div
                  key={c.id}
                  className='flex flex-row items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30'
                >
                  <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-300 dark:border-blue-700'>
                    <Image
                      src={getImageUrl(c.id)}
                      alt={c.id}
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full object-cover'
                    />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                    {c.description && (
                      <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                        {c.description}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div>
          <span className='font-semibold text-sm text-red-700 dark:text-red-300 flex items-center gap-1'>
            <span className='w-5 h-5 bg-red-200 rounded-full flex items-center justify-center mr-1'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='none'
                aria-label='shield'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M8 2L13 4V7C13 11 8 14 8 14C8 14 3 11 3 7V4L8 2Z'
                  stroke='#dc2626'
                  strokeWidth='2'
                  fill='#fca5a5'
                />
              </svg>
            </span>
            被克制对象
          </span>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counteredBy.length === 0 ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              char.counteredBy.map((c) => (
                <div
                  key={c.id}
                  className='flex flex-row items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/30'
                >
                  <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center border border-red-300 dark:border-red-700'>
                    <Image
                      src={getImageUrl(c.id)}
                      alt={c.id}
                      width={32}
                      height={32}
                      className='w-8 h-8 rounded-full object-cover'
                    />
                  </div>
                  <div className='flex flex-col'>
                    <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                    <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                      {c.description}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterRestraintDisplay;
