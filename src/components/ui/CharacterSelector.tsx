'use client';

import React, { useMemo, useState } from 'react';

import { AssetManager } from '@/lib/assetManager';
import type { CharacterRelationItem } from '@/data/types';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { characters, type FactionId } from '@/data';

export type RelationKey = 'counters' | 'counteredBy' | 'counterEachOther' | 'collaborators';

export function CharacterSelector({
  currentCharacterId,
  factionId,
  relationType,
  existingRelations,
  onSelect,
}: {
  currentCharacterId: string;
  factionId: FactionId;
  relationType: RelationKey;
  existingRelations: CharacterRelationItem[];
  onSelect: (characterId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const availableCharacters = useMemo(() => {
    const allCharacters = Object.values(characters) as Array<{ id: string; factionId: FactionId }>;

    let filteredCharacters = allCharacters;
    if (relationType === 'collaborators') {
      filteredCharacters = allCharacters.filter((char) => char.factionId === factionId);
    } else {
      filteredCharacters = allCharacters.filter((char) => char.factionId !== factionId);
    }

    const existingIds = existingRelations.map((r) => r.id);
    return filteredCharacters.filter(
      (char) => char.id !== currentCharacterId && !existingIds.includes(char.id)
    );
  }, [currentCharacterId, existingRelations, factionId, relationType]);

  const handleSelect = (characterId: string) => {
    onSelect(characterId);
    setIsOpen(false);
  };

  if (availableCharacters.length === 0) {
    return null;
  }

  return (
    <div className='relative inline-block'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/60 dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:focus-visible:ring-yellow-300/70'
        aria-label={`添加${relationType}关系`}
      >
        <PlusIcon className='h-4 w-4' aria-hidden='true' />
      </button>

      {isOpen && (
        <div className='absolute top-full right-0 z-50 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 dark:border-gray-700 dark:bg-slate-900 dark:ring-white/10'>
          {availableCharacters.map((char) => (
            <button
              key={char.id}
              type='button'
              onClick={() => handleSelect(char.id)}
              className='flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-100 focus:outline-none focus-visible:bg-gray-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800'
              aria-label={`选择${char.id}`}
            >
              <Image
                src={
                  relationType === 'collaborators'
                    ? AssetManager.getCharacterImageUrl(char.id, 'mouse')
                    : factionId === 'cat'
                      ? AssetManager.getCharacterImageUrl(char.id, 'mouse')
                      : AssetManager.getCharacterImageUrl(char.id, 'cat')
                }
                alt={char.id}
                width={28}
                height={28}
                className='h-7 w-7 rounded-full object-cover'
              />
              <span className='text-gray-700 dark:text-slate-200'>{char.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CharacterSlotsSelector({
  title,
  characters: characterList,
  selectedIds,
  onSelectedIdsChange,
  getCharacterImageUrl,
}: {
  title: string;
  characters: Array<{ id: string }>;
  selectedIds: Array<string | null>;
  onSelectedIdsChange: (next: Array<string | null>) => void;
  getCharacterImageUrl: (characterId: string) => string;
}) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const handleSlotClick = (index: number) => {
    setActiveSlotIndex(index);
    setIsSelectorOpen(true);
  };

  const handleSelect = (characterId: string) => {
    if (activeSlotIndex === null) return;
    const next = [...selectedIds];
    next[activeSlotIndex] = characterId;
    onSelectedIdsChange(next);
    setIsSelectorOpen(false);
    setActiveSlotIndex(null);
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const next = [...selectedIds];
    next[index] = null;
    onSelectedIdsChange(next);
  };

  return (
    <>
      <div className='mb-12 flex flex-wrap justify-center gap-4 dark:text-slate-200'>
        {selectedIds.map((id, index) => (
          <div
            key={index}
            onClick={() => handleSlotClick(index)}
            className={`relative flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${id ? 'border-solid border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'} `}
          >
            {id ? (
              <>
                <Image
                  src={getCharacterImageUrl(id)}
                  alt={id}
                  width={80}
                  height={80}
                  className='h-20 w-20 object-contain'
                />
                <button
                  onClick={(e) => handleRemove(e, index)}
                  className='absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 dark:bg-red-600 dark:hover:bg-red-500 dark:focus-visible:ring-red-300/70'
                  aria-label='移除已选择角色'
                  type='button'
                >
                  <TrashIcon className='h-3 w-3' />
                </button>
                <div className='absolute right-0 bottom-1 left-0 truncate px-1 text-center text-xs font-medium text-gray-700 dark:text-gray-300'>
                  {id}
                </div>
              </>
            ) : (
              <PlusIcon className='h-8 w-8 text-gray-400' />
            )}
          </div>
        ))}
      </div>

      {isSelectorOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'
          onClick={() => setIsSelectorOpen(false)}
        >
          <div
            className='flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-slate-800'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-slate-100'>{title}</h3>
              <button
                onClick={() => setIsSelectorOpen(false)}
                className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                aria-label='关闭选择器'
                type='button'
              >
                ✕
              </button>
            </div>
            <div className='grid grid-cols-4 gap-4 overflow-y-auto p-4 sm:grid-cols-5 md:grid-cols-6'>
              {characterList.map((character) => {
                const isSelected = selectedIds.includes(character.id);
                return (
                  <button
                    key={character.id}
                    onClick={() => !isSelected && handleSelect(character.id)}
                    disabled={isSelected}
                    type='button'
                    className={`flex flex-col items-center gap-2 rounded-lg p-2 transition-colors ${isSelected ? 'cursor-not-allowed opacity-50 grayscale' : 'hover:bg-gray-100 focus:outline-none focus-visible:bg-gray-100 dark:hover:bg-gray-700 dark:focus-visible:bg-gray-700'} `}
                  >
                    <Image
                      src={getCharacterImageUrl(character.id)}
                      alt={character.id}
                      width={48}
                      height={48}
                      className='h-12 w-12 object-contain'
                    />
                    <span className='text-center text-xs text-gray-800 dark:text-slate-200'>
                      {character.id}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Simple character selector for articles (game strategy articles).
 * Shows all characters in a dropdown with search functionality.
 */
export function ArticleCharacterSelector({
  selectedCharacterId,
  onSelect,
  disabled = false,
}: {
  selectedCharacterId: string | null;
  onSelect: (characterId: string | null) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const allCharacters = useMemo(() => {
    return Object.values(characters) as Array<{ id: string; factionId: FactionId }>;
  }, []);

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return allCharacters;
    const query = searchQuery.toLowerCase();
    return allCharacters.filter((char) => char.id.toLowerCase().includes(query));
  }, [allCharacters, searchQuery]);

  const selectedCharacter = useMemo(() => {
    if (!selectedCharacterId) return null;
    return allCharacters.find((c) => c.id === selectedCharacterId) || null;
  }, [allCharacters, selectedCharacterId]);

  const handleSelect = (characterId: string) => {
    onSelect(characterId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
  };

  return (
    <div className='relative'>
      <button
        type='button'
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-lg transition-all duration-200 ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
            : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
        }`}
      >
        {selectedCharacter ? (
          <div className='flex items-center gap-3'>
            <Image
              src={AssetManager.getCharacterImageUrl(
                selectedCharacter.id,
                selectedCharacter.factionId
              )}
              alt={selectedCharacter.id}
              width={32}
              height={32}
              className='h-8 w-8 rounded-full object-cover'
            />
            <span>{selectedCharacter.id}</span>
          </div>
        ) : (
          <span className='text-gray-500 dark:text-gray-400'>请选择角色</span>
        )}
        <div className='flex items-center gap-2'>
          {selectedCharacter && !disabled && (
            <button
              type='button'
              onClick={handleClear}
              className='rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300'
              aria-label='清除选择'
            >
              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          )}
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
          </svg>
        </div>
      </button>

      {isOpen && (
        <>
          <div className='fixed inset-0 z-40' onClick={() => setIsOpen(false)} />
          <div className='absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-slate-900'>
            <div className='border-b border-gray-200 p-2 dark:border-gray-700'>
              <input
                type='text'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='搜索角色...'
                className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400'
                autoFocus
              />
            </div>
            <div className='max-h-60 overflow-y-auto'>
              {filteredCharacters.length === 0 ? (
                <div className='px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400'>
                  未找到匹配的角色
                </div>
              ) : (
                filteredCharacters.map((char) => (
                  <button
                    key={char.id}
                    type='button'
                    onClick={() => handleSelect(char.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800 ${
                      selectedCharacterId === char.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'text-gray-800 dark:text-slate-100'
                    }`}
                  >
                    <Image
                      src={AssetManager.getCharacterImageUrl(char.id, char.factionId)}
                      alt={char.id}
                      width={28}
                      height={28}
                      className='h-7 w-7 rounded-full object-cover'
                    />
                    <span>{char.id}</span>
                    <span
                      className={`ml-auto rounded px-1.5 py-0.5 text-xs ${
                        char.factionId === 'cat'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                    >
                      {char.factionId === 'cat' ? '猫' : '鼠'}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
