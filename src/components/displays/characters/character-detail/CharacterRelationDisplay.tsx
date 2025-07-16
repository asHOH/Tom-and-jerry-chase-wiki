'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import { FactionId } from '@/data';
import { getCatImageUrl } from '@/data/catCharacters';
import { getMouseImageUrl } from '@/data/mouseCharacters';
import { CharacterRelation, CharacterRelationItem } from '@/data/types';
import { characters } from '@/data';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';
import { setNestedProperty } from '@/lib/editUtils';
import EditableField from '@/components/ui/EditableField';

type Props = {
  id: string;
  factionId: FactionId;
};

// Hook to manage counters relations
function useCounters(characterId: string) {
  const localCharacter = useSnapshot(characters[characterId]!);

  const updateCounters = useCallback(
    (updatedCounters: CharacterRelationItem[]) => {
      setNestedProperty(characters, `${characterId}.counters`, updatedCounters);
    },
    [characterId]
  );

  const handleUpdate = useCallback(
    (index: number, field: 'description' | 'isMinor', newValue: string | boolean) => {
      const currentCounters = localCharacter.counters || [];
      const updatedCounters = currentCounters.map((counter, i) =>
        i === index ? { ...counter, [field]: newValue } : counter
      );
      updateCounters(updatedCounters);
    },
    [localCharacter.counters, updateCounters]
  );

  const handleAdd = useCallback(
    (characterId: string, description: string = '', isMinor: boolean = false) => {
      const currentCounters = localCharacter.counters || [];
      const newCounter: CharacterRelationItem = { id: characterId, description, isMinor };
      updateCounters([...currentCounters, newCounter]);
    },
    [localCharacter.counters, updateCounters]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const currentCounters = localCharacter.counters || [];
      const updatedCounters = currentCounters.filter((_, i) => i !== index);
      updateCounters(updatedCounters);
    },
    [localCharacter.counters, updateCounters]
  );

  const toggleIsMinor = useCallback(
    (index: number) => {
      const currentCounters = localCharacter.counters || [];
      const updatedCounters = currentCounters.map((counter, i) =>
        i === index ? { ...counter, isMinor: !counter.isMinor } : counter
      );
      updateCounters(updatedCounters);
    },
    [localCharacter.counters, updateCounters]
  );

  return { handleUpdate, handleAdd, handleRemove, toggleIsMinor };
}

// Hook to manage counteredBy relations
function useCounteredBy(characterId: string) {
  const localCharacter = useSnapshot(characters[characterId]!);

  const updateCounteredBy = useCallback(
    (updatedCounteredBy: CharacterRelationItem[]) => {
      setNestedProperty(characters, `${characterId}.counteredBy`, updatedCounteredBy);
    },
    [characterId]
  );

  const handleUpdate = useCallback(
    (index: number, field: 'description' | 'isMinor', newValue: string | boolean) => {
      const currentCounteredBy = localCharacter.counteredBy || [];
      const updatedCounteredBy = currentCounteredBy.map((counter, i) =>
        i === index ? { ...counter, [field]: newValue } : counter
      );
      updateCounteredBy(updatedCounteredBy);
    },
    [localCharacter.counteredBy, updateCounteredBy]
  );

  const handleAdd = useCallback(
    (characterId: string, description: string = '', isMinor: boolean = false) => {
      const currentCounteredBy = localCharacter.counteredBy || [];
      const newCounter: CharacterRelationItem = { id: characterId, description, isMinor };
      updateCounteredBy([...currentCounteredBy, newCounter]);
    },
    [localCharacter.counteredBy, updateCounteredBy]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const currentCounteredBy = localCharacter.counteredBy || [];
      const updatedCounteredBy = currentCounteredBy.filter((_, i) => i !== index);
      updateCounteredBy(updatedCounteredBy);
    },
    [localCharacter.counteredBy, updateCounteredBy]
  );

  const toggleIsMinor = useCallback(
    (index: number) => {
      const currentCounteredBy = localCharacter.counteredBy || [];
      const updatedCounteredBy = currentCounteredBy.map((counter, i) =>
        i === index ? { ...counter, isMinor: !counter.isMinor } : counter
      );
      updateCounteredBy(updatedCounteredBy);
    },
    [localCharacter.counteredBy, updateCounteredBy]
  );

  return { handleUpdate, handleAdd, handleRemove, toggleIsMinor };
}

// Hook to manage collaborators relations
function useCollaborators(characterId: string) {
  const localCharacter = useSnapshot(characters[characterId]!);

  const updateCollaborators = useCallback(
    (updatedCollaborators: CharacterRelationItem[]) => {
      setNestedProperty(characters, `${characterId}.collaborators`, updatedCollaborators);
    },
    [characterId]
  );

  const handleUpdate = useCallback(
    (index: number, field: 'description' | 'isMinor', newValue: string | boolean) => {
      const currentCollaborators = localCharacter.collaborators || [];
      const updatedCollaborators = currentCollaborators.map((collab, i) =>
        i === index ? { ...collab, [field]: newValue } : collab
      );
      updateCollaborators(updatedCollaborators);
    },
    [localCharacter.collaborators, updateCollaborators]
  );

  const handleAdd = useCallback(
    (characterId: string, description: string = '', isMinor: boolean = false) => {
      const currentCollaborators = localCharacter.collaborators || [];
      const newCollab: CharacterRelationItem = { id: characterId, description, isMinor };
      updateCollaborators([...currentCollaborators, newCollab]);
    },
    [localCharacter.collaborators, updateCollaborators]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const currentCollaborators = localCharacter.collaborators || [];
      const updatedCollaborators = currentCollaborators.filter((_, i) => i !== index);
      updateCollaborators(updatedCollaborators);
    },
    [localCharacter.collaborators, updateCollaborators]
  );

  const toggleIsMinor = useCallback(
    (index: number) => {
      const currentCollaborators = localCharacter.collaborators || [];
      const updatedCollaborators = currentCollaborators.map((collab, i) =>
        i === index ? { ...collab, isMinor: !collab.isMinor } : collab
      );
      updateCollaborators(updatedCollaborators);
    },
    [localCharacter.collaborators, updateCollaborators]
  );

  return { handleUpdate, handleAdd, handleRemove, toggleIsMinor };
}

// Character selection component for adding relations
function CharacterSelector({
  currentCharacterId,
  factionId,
  relationType,
  existingRelations,
  onSelect,
}: {
  currentCharacterId: string;
  factionId: FactionId;
  relationType: 'counters' | 'counteredBy' | 'collaborators';
  existingRelations: CharacterRelationItem[];
  onSelect: (characterId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // Get available characters based on relation type
  const availableCharacters = React.useMemo(() => {
    const allCharacters = Object.values(characters);

    // Filter based on relation type
    let filteredCharacters = allCharacters;
    if (relationType === 'collaborators') {
      // Collaborators: same faction (mouse only)
      filteredCharacters = allCharacters.filter((char) => char.factionId === factionId);
    } else {
      // Counters/counteredBy: opposite faction
      filteredCharacters = allCharacters.filter((char) => char.factionId !== factionId);
    }

    // Exclude current character and existing relations
    const existingIds = existingRelations.map((r) => r.id);
    return filteredCharacters.filter(
      (char) => char.id !== currentCharacterId && !existingIds.includes(char.id)
    );
  }, [currentCharacterId, factionId, relationType, existingRelations]);

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
        className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
      >
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth='2'
          stroke='currentColor'
          className='w-4 h-4'
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
        </svg>
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto'>
          {availableCharacters.map((char) => (
            <button
              key={char.id}
              type='button'
              onClick={() => handleSelect(char.id)}
              className='w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2'
            >
              <Image
                src={factionId === 'cat' ? getMouseImageUrl(char.id) : getCatImageUrl(char.id)}
                alt={char.id}
                width={20}
                height={20}
                className='w-5 h-5 rounded-full object-cover'
              />
              <span className='text-gray-700 dark:text-gray-300'>{char.id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getCharacterRelation(id: string): CharacterRelation {
  const char = characters[id];
  if (!char) {
    return {
      counters: [],
      counteredBy: [],
      collaborators: [],
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
      return item;
    });

  const counters = Object.values(characters)
    .filter((c) => c.counteredBy?.some((countered) => countered.id === id))
    .map((c) => {
      const restraintItem = c.counteredBy?.find((countered) => countered.id === id);
      const item =
        restraintItem && typeof restraintItem.description === 'string'
          ? { id: c.id, description: restraintItem.description, isMinor: !!restraintItem.isMinor }
          : { id: c.id, isMinor: false };
      return item;
    });

  const collaboratorsFromOthers = Object.values(characters)
    .filter((c) => c.collaborators?.some((collab) => collab.id === id))
    .map((c) => {
      const collabItem = c.collaborators?.find((collab) => collab.id === id);
      const item =
        collabItem && typeof collabItem.description === 'string'
          ? { id: c.id, description: collabItem.description, isMinor: !!collabItem.isMinor }
          : { id: c.id, isMinor: false };
      return item;
    });

  const ownCounters = (char.counters ?? []).map((item) => item);
  const ownCounteredBy = (char.counteredBy ?? []).map((item) => item);
  const ownCollaborators = (char.collaborators ?? []).map((item) => item);

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
  const { isEditMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const getImageUrl = factionId == 'cat' ? getMouseImageUrl : getCatImageUrl;
  const char = getCharacterRelation(id);
  const { handleSelectCharacter } = useAppContext();

  // Get hooks for managing relations
  const countersHook = useCounters(id);
  const counteredByHook = useCounteredBy(id);
  const collaboratorsHook = useCollaborators(id);

  return (
    <div className='flex gap-6 items-start bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg shadow'>
      {/* Relationships */}
      <div className='flex flex-1 flex-col gap-4'>
        <div>
          <div className='flex items-center justify-between'>
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
            {isEditMode && (
              <CharacterSelector
                currentCharacterId={id}
                factionId={factionId}
                relationType='counters'
                existingRelations={[...(localCharacter.counters || [])]}
                onSelect={(characterId) => countersHook.handleAdd(characterId, '新增关系描述')}
              />
            )}
          </div>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counters.length === 0 && !isEditMode ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              char.counters.map((c) => {
                // Find the original index in the direct relations for edit operations
                const originalIndex = isEditMode
                  ? (localCharacter.counters || []).findIndex((oc) => oc.id === c.id)
                  : -1;
                const isDirectRelation = originalIndex !== -1;

                return (
                  <div
                    key={c.id}
                    className={`flex flex-row items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 ${
                      !isEditMode
                        ? 'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95'
                        : ''
                    } ${c.isMinor ? 'opacity-60' : ''}`}
                    role={!isEditMode ? 'button' : undefined}
                    tabIndex={!isEditMode ? 0 : undefined}
                    aria-label={!isEditMode ? `选择角色 ${c.id}` : undefined}
                    onClick={() => {
                      if (!isEditMode) {
                        handleSelectCharacter(c.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
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
                    <div className='flex flex-col flex-1'>
                      <div className='flex items-center gap-1'>
                        <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                        {isEditMode && isDirectRelation ? (
                          <button
                            type='button'
                            onClick={() => countersHook.toggleIsMinor(originalIndex)}
                            className='text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer'
                          >
                            {c.isMinor ? '次要' : '主要'}
                          </button>
                        ) : (
                          !isEditMode &&
                          c.isMinor && (
                            <span className='text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full'>
                              次要
                            </span>
                          )
                        )}
                      </div>
                      {isEditMode && isDirectRelation ? (
                        <EditableField
                          tag='span'
                          path={`counters.${originalIndex}.description`}
                          initialValue={c.description || ''}
                          className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                          onSave={(newValue) =>
                            countersHook.handleUpdate(originalIndex, 'description', newValue)
                          }
                        />
                      ) : (
                        !isEditMode &&
                        c.description && (
                          <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                            {c.description}
                          </span>
                        )
                      )}
                    </div>
                    {isEditMode && isDirectRelation && (
                      <button
                        type='button'
                        onClick={() => countersHook.handleRemove(originalIndex)}
                        className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth='2'
                          stroke='currentColor'
                          className='w-4 h-4'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div>
          <div className='flex items-center justify-between'>
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
            {isEditMode && (
              <CharacterSelector
                currentCharacterId={id}
                factionId={factionId}
                relationType='counteredBy'
                existingRelations={[...(localCharacter.counteredBy || [])]}
                onSelect={(characterId) => counteredByHook.handleAdd(characterId, '新增关系描述')}
              />
            )}
          </div>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counteredBy.length === 0 && !isEditMode ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              char.counteredBy.map((c) => {
                // Find the original index in the direct relations for edit operations
                const originalIndex = isEditMode
                  ? (localCharacter.counteredBy || []).findIndex((oc) => oc.id === c.id)
                  : -1;
                const isDirectRelation = originalIndex !== -1;

                return (
                  <div
                    key={c.id}
                    className={`flex flex-row items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/30 ${
                      !isEditMode
                        ? 'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95'
                        : ''
                    } ${c.isMinor ? 'opacity-60' : ''}`}
                    role={!isEditMode ? 'button' : undefined}
                    tabIndex={!isEditMode ? 0 : undefined}
                    aria-label={!isEditMode ? `选择角色 ${c.id}` : undefined}
                    onClick={() => {
                      if (!isEditMode) {
                        handleSelectCharacter(c.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
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
                    <div className='flex flex-col flex-1'>
                      <div className='flex items-center gap-1'>
                        <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                        {isEditMode && isDirectRelation ? (
                          <button
                            type='button'
                            onClick={() => counteredByHook.toggleIsMinor(originalIndex)}
                            className='text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full hover:bg-red-300 dark:hover:bg-red-600 cursor-pointer'
                          >
                            {c.isMinor ? '次要' : '主要'}
                          </button>
                        ) : (
                          !isEditMode &&
                          c.isMinor && (
                            <span className='text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full'>
                              次要
                            </span>
                          )
                        )}
                      </div>
                      {isEditMode && isDirectRelation ? (
                        <EditableField
                          tag='span'
                          path={`counteredBy.${originalIndex}.description`}
                          initialValue={c.description || ''}
                          className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                          onSave={(newValue) =>
                            counteredByHook.handleUpdate(originalIndex, 'description', newValue)
                          }
                        />
                      ) : (
                        !isEditMode &&
                        c.description && (
                          <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                            {c.description}
                          </span>
                        )
                      )}
                    </div>
                    {isEditMode && isDirectRelation && (
                      <button
                        type='button'
                        onClick={() => counteredByHook.handleRemove(originalIndex)}
                        className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                      >
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                          strokeWidth='2'
                          stroke='currentColor'
                          className='w-4 h-4'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
        {factionId == 'mouse' && (
          <div>
            <div className='flex items-center justify-between'>
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
              {isEditMode && (
                <CharacterSelector
                  currentCharacterId={id}
                  factionId={factionId}
                  relationType='collaborators'
                  existingRelations={[...(localCharacter.collaborators || [])]}
                  onSelect={(characterId) =>
                    collaboratorsHook.handleAdd(characterId, '新增关系描述')
                  }
                />
              )}
            </div>
            <div className='grid grid-cols-1 gap-y-3 mt-2'>
              {char.collaborators.length === 0 && !isEditMode ? (
                <span className='text-xs text-gray-400'>无</span>
              ) : (
                char.collaborators.map((c) => {
                  // Find the original index in the direct relations for edit operations
                  const originalIndex = isEditMode
                    ? (localCharacter.collaborators || []).findIndex((oc) => oc.id === c.id)
                    : -1;
                  const isDirectRelation = originalIndex !== -1;

                  return (
                    <div
                      key={c.id}
                      className={`flex flex-row items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/30 ${
                        !isEditMode
                          ? 'cursor-pointer transition-shadow hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95'
                          : ''
                      } ${c.isMinor ? 'opacity-60' : ''}`}
                      role={!isEditMode ? 'button' : undefined}
                      tabIndex={!isEditMode ? 0 : undefined}
                      aria-label={!isEditMode ? `选择角色 ${c.id}` : undefined}
                      onClick={() => {
                        if (!isEditMode) {
                          handleSelectCharacter(c.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
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
                      <div className='flex flex-col flex-1'>
                        <div className='flex items-center gap-1'>
                          <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                          {isEditMode && isDirectRelation ? (
                            <button
                              type='button'
                              onClick={() => collaboratorsHook.toggleIsMinor(originalIndex)}
                              className='text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full hover:bg-green-300 dark:hover:bg-green-600 cursor-pointer'
                            >
                              {c.isMinor ? '次要' : '主要'}
                            </button>
                          ) : (
                            !isEditMode &&
                            c.isMinor && (
                              <span className='text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full'>
                                次要
                              </span>
                            )
                          )}
                        </div>
                        {isEditMode && isDirectRelation ? (
                          <EditableField
                            tag='span'
                            path={`collaborators.${originalIndex}.description`}
                            initialValue={c.description || ''}
                            className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                            onSave={(newValue) =>
                              collaboratorsHook.handleUpdate(originalIndex, 'description', newValue)
                            }
                          />
                        ) : (
                          !isEditMode &&
                          c.description && (
                            <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                              {c.description}
                            </span>
                          )
                        )}
                      </div>
                      {isEditMode && isDirectRelation && (
                        <button
                          type='button'
                          onClick={() => collaboratorsHook.handleRemove(originalIndex)}
                          className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth='2'
                            stroke='currentColor'
                            className='w-4 h-4'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterRelationDisplay;
