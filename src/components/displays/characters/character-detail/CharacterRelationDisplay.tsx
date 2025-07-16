'use client';

import React from 'react';
import Image from 'next/image';
import { FactionId } from '@/data';
import { getCatImageUrl } from '@/data/catCharacters';
import { getMouseImageUrl } from '@/data/mouseCharacters';
import { CharacterRelation, CharacterRelationItem } from '@/data/types';
type Props = {
  id: string;
  factionId: FactionId;
};

import { characters } from '@/data';
import { useAppContext } from '@/context/AppContext';

function getCharacterRelation(id: string): CharacterRelation {
  const char = characters[id];
  if (!char) {
    return {
      counters: [],
      counteredBy: [],
      collaborators: [],
    };
  }

  // Helper to add isMinor from relation item, fallback to false
  function enrichRelationItem(item: CharacterRelationItem) {
    return {
      ...item,
      isMinor: item.isMinor ?? false,
    };
  }

  const counteredBy = Object.values(characters)
    .filter((c) => c.counters?.some((counter) => counter.id === id))
    .map((c) => {
      const restraintItem = c.counters?.find((counter) => counter.id === id);
      const item =
        restraintItem && typeof restraintItem.description === 'string'
          ? { id: c.id, description: restraintItem.description, isMinor: !!restraintItem.isMinor }
          : { id: c.id, isMinor: false };
      return enrichRelationItem(item);
    });

  const counters = Object.values(characters)
    .filter((c) => c.counteredBy?.some((countered) => countered.id === id))
    .map((c) => {
      const restraintItem = c.counteredBy?.find((countered) => countered.id === id);
      const item =
        restraintItem && typeof restraintItem.description === 'string'
          ? { id: c.id, description: restraintItem.description, isMinor: !!restraintItem.isMinor }
          : { id: c.id, isMinor: false };
      return enrichRelationItem(item);
    });

  const collaboratorsFromOthers = Object.values(characters)
    .filter((c) => c.collaborators?.some((collab) => collab.id === id))
    .map((c) => {
      const collabItem = c.collaborators?.find((collab) => collab.id === id);
      const item =
        collabItem && typeof collabItem.description === 'string'
          ? { id: c.id, description: collabItem.description, isMinor: !!collabItem.isMinor }
          : { id: c.id, isMinor: false };
      return enrichRelationItem(item);
    });

  const ownCounters = (char.counters ?? []).map((item) => enrichRelationItem(item));
  const ownCounteredBy = (char.counteredBy ?? []).map((item) => enrichRelationItem(item));
  const ownCollaborators = (char.collaborators ?? []).map((item) => enrichRelationItem(item));

  const mergedCounters = [
    ...ownCounters,
    ...counters.filter((c) => !ownCounters.some((oc) => oc.id === c.id)),
  ];
  const mergedCounteredBy = [
    ...ownCounteredBy,
    ...counteredBy.filter((c) => !ownCounteredBy.some((oc) => oc.id === c.id)),
  ];
  const mergedCollaborators = [
    ...ownCollaborators,
    ...collaboratorsFromOthers.filter((c) => !ownCollaborators.some((oc) => oc.id === c.id)),
  ];

  return {
    counters: mergedCounters,
    counteredBy: mergedCounteredBy,
    collaborators: mergedCollaborators,
  };
}

const CharacterRelationDisplay: React.FC<Props> = ({ id, factionId }) => {
  const getImageUrl = factionId == 'cat' ? getMouseImageUrl : getCatImageUrl;
  const char = getCharacterRelation(id);
  const { handleSelectCharacter } = useAppContext();
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
            被{id}克制的角色
          </span>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counters.length === 0 ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              char.counters.map((c) => (
                <div
                  key={c.id}
                  role='button'
                  tabIndex={0}
                  aria-label={`选择角色 ${c.id}`}
                  className='flex flex-row items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95'
                  onClick={() => {
                    handleSelectCharacter(c.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectCharacter(c.id);
                    }
                  }}
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
            克制{id}的角色
          </span>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counteredBy.length === 0 ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              char.counteredBy.map((c) => (
                <div
                  key={c.id}
                  role='button'
                  tabIndex={0}
                  aria-label={`选择角色 ${c.id}`}
                  className='flex flex-row items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/30 cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95'
                  onClick={() => {
                    handleSelectCharacter(c.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelectCharacter(c.id);
                    }
                  }}
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
        {factionId == 'mouse' && (
          <div>
            <span className='font-semibold text-sm text-green-700 dark:text-green-300 flex items-center gap-1'>
              <span className='w-5 h-5 bg-green-200 rounded-full flex items-center justify-center mr-1'>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  aria-label='collaborator'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <circle cx='8' cy='8' r='7' stroke='#16a34a' strokeWidth='2' fill='#bbf7d0' />
                  <path d='M5 10c0-1.5 2-1.5 2-3s-2-1.5-2-3' stroke='#16a34a' strokeWidth='1.5' />
                  <path d='M11 10c0-1.5-2-1.5-2-3s2-1.5 2-3' stroke='#16a34a' strokeWidth='1.5' />
                </svg>
              </span>
              与{id}协作的角色
            </span>
            <div className='grid grid-cols-1 gap-y-3 mt-2'>
              {char.collaborators.length === 0 ? (
                <span className='text-xs text-gray-400'>无</span>
              ) : (
                char.collaborators.map((c) => (
                  <div
                    key={c.id}
                    role='button'
                    tabIndex={0}
                    aria-label={`选择角色 ${c.id}`}
                    className='flex flex-row items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/30 cursor-pointer transition-shadow hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95'
                    onClick={() => {
                      handleSelectCharacter(c.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleSelectCharacter(c.id);
                      }
                    }}
                  >
                    <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center border border-green-300 dark:border-green-700'>
                      <Image
                        src={getMouseImageUrl(c.id)}
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
        )}
      </div>
    </div>
  );
};

export default CharacterRelationDisplay;
