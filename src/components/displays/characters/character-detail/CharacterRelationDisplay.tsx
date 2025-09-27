'use client';

import React, { useCallback, useState } from 'react';
import Image from '@/components/Image';
import { cards, FactionId, specialSkills } from '@/data';
import { AssetManager } from '@/lib/assetManager';
import { CharacterRelation, CharacterRelationItem } from '@/data/types';
import { characters } from '@/data';
import { useAppContext } from '@/context/AppContext';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';
import { setNestedProperty } from '@/lib/editUtils';
import EditableField from '@/components/ui/EditableField';
import clsx from 'clsx';
import { useNavigation } from '@/lib/useNavigation';
import KnowledgeCardSelector from './KnowledgeCardSelector';
import SpecialSkillSelector from './SpecialSkillSelector';

type Props = {
  id: string;
  factionId: FactionId;
};

// Lightweight generic hook to manage character relation arrays
type RelationKey = 'counters' | 'counteredBy' | 'counterEachOther' | 'collaborators';
type RelationArrays = Partial<Record<RelationKey, readonly CharacterRelationItem[]>>;

export type ExtraRelationKey =
  | 'countersKnowledgeCards'
  | 'counteredByKnowledgeCards'
  | 'countersSpecialSkills'
  | 'counteredBySpecialSkills';

type AccentName = 'blue' | 'amber' | 'red' | 'green';

export const ACCENT_STYLES: Record<AccentName, {
  headerText: string;
  iconBg: string;
  cardBg: string;
  cardHover: string;
  badge: string;
}> = {
  blue: {
    headerText: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-200',
    cardBg: 'bg-blue-50 dark:bg-blue-900/30',
    cardHover:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95',
    badge: 'bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200',
  },
  amber: {
    headerText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-200',
    cardBg: 'bg-amber-50 dark:bg-amber-900/30',
    cardHover:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-95',
    badge: 'bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200',
  },
  red: {
    headerText: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-200',
    cardBg: 'bg-red-50 dark:bg-red-900/30',
    cardHover:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95',
    badge: 'bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200',
  },
  green: {
    headerText: 'text-green-700 dark:text-green-300',
    iconBg: 'bg-green-200',
    cardBg: 'bg-green-50 dark:bg-green-900/30',
    cardHover:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95',
    badge: 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200',
  },
};

export type SectionItem =
  | { type: 'character'; data: CharacterRelationItem }
  | { type: 'knowledgeCard'; data: CharacterRelationItem; idx: number; extraKey: ExtraRelationKey }
  | { type: 'specialSkill'; data: CharacterRelationItem; idx: number; extraKey: ExtraRelationKey };

export type SectionConfig = {
  key: RelationKey;
  accent: AccentName;
  title: (params: { id: string; factionId: FactionId }) => string;
  icon: React.ReactNode;
  characterAria: {
    view: (characterId: string) => string;
    edit: (characterId: string) => string;
    toggle: (characterId: string, isMinor: boolean) => string;
    remove: (characterId: string) => string;
  };
  show?: (factionId: FactionId) => boolean;
  includeKnowledgeKey?: ExtraRelationKey;
  includeSpecialKey?: ExtraRelationKey;
  selectExistingRelations?: (relations: CharacterRelation) => CharacterRelationItem[];
  knowledgeSelectorFaction?: (factionId: FactionId) => FactionId;
  specialSkillSelectorFaction?: (factionId: FactionId) => FactionId;
  specialSkillDisplayFaction?: (factionId: FactionId) => FactionId;
  getCharacterImage: (characterId: string, factionId: FactionId) => string;
};

function useRelationEditor(characterId: string, key: RelationKey) {
  const localCharacter = useSnapshot(characters[characterId]!) as unknown as RelationArrays;

  const update = useCallback(
    (updated: CharacterRelationItem[]) => {
      setNestedProperty(characters, `${characterId}.${key}`, updated);
    },
    [characterId, key]
  );

  const handleUpdate = useCallback(
    (index: number, field: 'description' | 'isMinor', newValue: string | boolean) => {
      const current = (localCharacter[key] ?? []) as readonly CharacterRelationItem[];
      const updated = current.map((item, i) =>
        i === index ? { ...item, [field]: newValue } : item
      );
      update(updated);
    },
    [localCharacter, key, update]
  );

  const handleAdd = useCallback(
    (relId: string, description: string = '', isMinor: boolean = false) => {
      const current = (localCharacter[key] ?? []) as readonly CharacterRelationItem[];
      const newItem: CharacterRelationItem = { id: relId, description, isMinor };
      update([...current, newItem]);
    },
    [localCharacter, key, update]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const current = (localCharacter[key] ?? []) as readonly CharacterRelationItem[];
      const updated = current.filter((_, i) => i !== index);
      update(updated);
    },
    [localCharacter, key, update]
  );

  const toggleIsMinor = useCallback(
    (index: number) => {
      const current = (localCharacter[key] ?? []) as readonly CharacterRelationItem[];
      const updated = current.map((item, i) =>
        i === index ? { ...item, isMinor: !item.isMinor } : item
      );
      update(updated);
    },
    [localCharacter, key, update]
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
  relationType: RelationKey;
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
      // Counters/counteredBy/counterEachOther: opposite faction
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
        aria-label={`添加${relationType}关系`}
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
        <div className='absolute top-full right-0 mt-1 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto'>
          {availableCharacters.map((char) => (
            <button
              key={char.id}
              type='button'
              onClick={() => handleSelect(char.id)}
              className='w-full text-left px-3 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3'
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
                className='w-7 h-7 rounded-full object-cover'
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
      countersKnowledgeCards: [],
      countersSpecialSkills: [],
      counteredBy: [],
      collaborators: [],
      counteredByKnowledgeCards: [],
      counterEachOther: [],
      counteredBySpecialSkills: [],
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

  const counterEachOther = Object.values(characters)
    .filter((c) => c.counterEachOther?.some((counter) => counter.id === id))
    .map((c) => {
      const restraintItem = c.counterEachOther?.find((counter) => counter.id === id);
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
  const ownCounterEachOther = (char.counterEachOther ?? []).map((item) => item);
  const ownCollaborators = (char.collaborators ?? []).map((item) => item);

  const mergedCounters = [
    ...ownCounters,
    ...counters.filter((c) => !ownCounters.some((oc) => oc.id === c.id)),
  ];
  const mergedCounteredBy = [
    ...ownCounteredBy,
    ...counteredBy.filter((c) => !ownCounteredBy.some((oc) => oc.id === c.id)),
  ];
  const mergedCounterEachOther = [
    ...ownCounterEachOther,
    ...counterEachOther.filter((c) => !ownCounterEachOther.some((oc) => oc.id === c.id)),
  ];
  const mergedCollaborators = [
    ...ownCollaborators,
    ...collaboratorsFromOthers.filter((c) => !ownCollaborators.some((oc) => oc.id === c.id)),
  ];

  return {
    counters: mergedCounters,
    countersKnowledgeCards: char.countersKnowledgeCards ?? [],
    countersSpecialSkills: char.countersSpecialSkills ?? [],
    counteredBy: mergedCounteredBy,
    collaborators: mergedCollaborators,
    counteredByKnowledgeCards: char.counteredByKnowledgeCards ?? [],
    counteredBySpecialSkills: char.counteredBySpecialSkills ?? [],
    counterEachOther: mergedCounterEachOther,
  };
}

const CharacterRelationDisplay: React.FC<Props> = ({ id, factionId }) => {
  const { isEditMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const localCharacter = useSnapshot(characters[characterId]!);
  const getImageUrl = (id: string) =>
    AssetManager.getCharacterImageUrl(id, factionId == 'cat' ? 'mouse' : 'cat');
  const char = getCharacterRelation(id);
  const { handleSelectCharacter } = useAppContext();
  const { navigate } = useNavigation();
  const oppositeFactionId = factionId === 'cat' ? 'mouse' : 'cat';

  const combinedSelectorRelations = React.useMemo(() => {
    const map = new Map<string, CharacterRelationItem>();
    [char.counters, char.counteredBy, char.counterEachOther].forEach((list) => {
      list.forEach((item) => {
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });
    });
    return Array.from(map.values());
  }, [char.counters, char.counterEachOther, char.counteredBy]);

  // Get hooks for managing relations
  const countersHook = useRelationEditor(id, 'counters');
  const counteredByHook = useRelationEditor(id, 'counteredBy');
  const counterEachOtherHook = useRelationEditor(id, 'counterEachOther');
  const collaboratorsHook = useRelationEditor(id, 'collaborators');

  const relationHookMap: Record<RelationKey, ReturnType<typeof useRelationEditor>> = {
    counters: countersHook,
    counteredBy: counteredByHook,
    counterEachOther: counterEachOtherHook,
    collaborators: collaboratorsHook,
  };

  // Small helpers to dedupe array updates for knowledge cards and special skills
  type LocalExtra = Partial<Record<ExtraRelationKey, readonly CharacterRelationItem[]>>;
  const localExtra = localCharacter as unknown as LocalExtra;

  const localRelationsMap: Record<RelationKey, CharacterRelationItem[]> = {
    counters: Array.from((localCharacter.counters ?? []) as readonly CharacterRelationItem[]),
    counteredBy: Array.from((localCharacter.counteredBy ?? []) as readonly CharacterRelationItem[]),
    counterEachOther: Array.from(
      (localCharacter.counterEachOther ?? []) as readonly CharacterRelationItem[]
    ),
    collaborators: Array.from(
      (localCharacter.collaborators ?? []) as readonly CharacterRelationItem[]
    ),
  };

  const localExtraMap: Record<ExtraRelationKey, CharacterRelationItem[]> = {
    countersKnowledgeCards: Array.from(
      (localExtra.countersKnowledgeCards ?? []) as readonly CharacterRelationItem[]
    ),
    counteredByKnowledgeCards: Array.from(
      (localExtra.counteredByKnowledgeCards ?? []) as readonly CharacterRelationItem[]
    ),
    countersSpecialSkills: Array.from(
      (localExtra.countersSpecialSkills ?? []) as readonly CharacterRelationItem[]
    ),
    counteredBySpecialSkills: Array.from(
      (localExtra.counteredBySpecialSkills ?? []) as readonly CharacterRelationItem[]
    ),
  };

  const renderSection = (config: SectionConfig) => {
    if (config.show && !config.show(factionId)) {
      return null;
    }

    const accent = ACCENT_STYLES[config.accent];
    const relationHook = relationHookMap[config.key];
    const localRelations = localRelationsMap[config.key];
    const knowledgeKey = config.includeKnowledgeKey;
    const specialKey = config.includeSpecialKey;

    const relationItems = Array.from(
      ((char[config.key] ?? []) as readonly CharacterRelationItem[])
    ).map((item) => ({ type: 'character' as const, data: item }));

    const knowledgeItems = knowledgeKey
      ? (localExtraMap[knowledgeKey] ?? []).map((item, idx) => ({
          type: 'knowledgeCard' as const,
          data: item,
          idx,
          extraKey: knowledgeKey,
        }))
      : [];

    const specialItems = specialKey
      ? (localExtraMap[specialKey] ?? []).map((item, idx) => ({
          type: 'specialSkill' as const,
          data: item,
          idx,
          extraKey: specialKey,
        }))
      : [];

    const items: SectionItem[] = [...relationItems, ...knowledgeItems, ...specialItems].sort(
      (a, b) => {
        const aMinor = !!a.data.isMinor;
        const bMinor = !!b.data.isMinor;
        if (aMinor === bMinor) return 0;
        return aMinor ? 1 : -1;
      }
    );

    const existingRelations =
      config.selectExistingRelations?.(char) ??
      (config.key === 'collaborators' ? char.collaborators : combinedSelectorRelations);

    const hasContent = items.length > 0;
    const knowledgeSelectorFaction = config.knowledgeSelectorFaction?.(factionId) ?? oppositeFactionId;
    const specialSkillSelectorFaction = config.specialSkillSelectorFaction?.(factionId) ?? factionId;
    const specialSkillDisplayFaction = config.specialSkillDisplayFaction?.(factionId) ?? oppositeFactionId;

    return (
      <div>
        <div className='flex items-center justify-between'>
          <span
            className={clsx('font-semibold text-sm flex items-center gap-1', accent.headerText)}
          >
            <span
              className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center mr-1',
                accent.iconBg
              )}
            >
              {config.icon}
            </span>
            {config.title({ id, factionId })}
          </span>
          {isEditMode && (
            <div className='flex gap-2'>
              <CharacterSelector
                currentCharacterId={id}
                factionId={factionId}
                relationType={config.key}
                existingRelations={existingRelations}
                onSelect={(characterId) => relationHook.handleAdd(characterId, '新增关系描述')}
              />
              {knowledgeKey && (
                <KnowledgeCardSelector
                  selected={localExtraMap[knowledgeKey] ?? []}
                  onSelect={(cardName) => addExtraItem(knowledgeKey, cardName as string)}
                  factionId={knowledgeSelectorFaction}
                />
              )}
              {specialKey && (
                <SpecialSkillSelector
                  selected={localExtraMap[specialKey] ?? []}
                  factionId={specialSkillSelectorFaction}
                  onSelect={(skillName) => addExtraItem(specialKey, skillName as string)}
                />
              )}
            </div>
          )}
        </div>
        <div className='grid grid-cols-1 gap-y-3 mt-2'>
          {!hasContent && !isEditMode ? (
            <span className='text-xs text-gray-400'>无</span>
          ) : (
            items.map((item) => {
              if (item.type === 'character') {
                const relation = item.data;
                const originalIndex = isEditMode
                  ? localRelations.findIndex((local) => local.id === relation.id)
                  : -1;
                const isDirectRelation = originalIndex !== -1;
                const ariaLabel = isEditMode
                  ? config.characterAria.edit(relation.id)
                  : config.characterAria.view(relation.id);

                return (
                  <div
                    key={`character-${relation.id}`}
                    className={clsx(
                      'flex flex-row items-center gap-3 p-2 rounded-lg',
                      accent.cardBg,
                      !isEditMode && accent.cardHover,
                      relation.isMinor && 'opacity-60'
                    )}
                    {...(!isEditMode && { role: 'button', tabIndex: 0 })}
                    aria-label={ariaLabel}
                    onClick={() => {
                      if (!isEditMode) {
                        handleSelectCharacter(relation.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
                        handleSelectCharacter(relation.id);
                      }
                    }}
                  >
                    <Image
                      src={config.getCharacterImage(relation.id, factionId)}
                      alt={relation.id}
                      width={40}
                      height={40}
                      className='w-10 h-10 rounded-full object-cover'
                    />
                    <div className='flex flex-col flex-1'>
                      <div className='flex items-center gap-1'>
                        <span className='text-xs text-gray-700 dark:text-gray-300'>
                          {relation.id}
                        </span>
                        {isEditMode && isDirectRelation ? (
                          <button
                            type='button'
                            onClick={() => relationHook.toggleIsMinor(originalIndex)}
                            className={clsx(
                              'text-[10px] px-1 py-0.5 rounded-full hover:bg-opacity-80 cursor-pointer',
                              accent.badge
                            )}
                            aria-label={config.characterAria.toggle(
                              relation.id,
                              !!relation.isMinor
                            )}
                          >
                            {relation.isMinor ? '次要' : '主要'}
                          </button>
                        ) : (
                          !isEditMode &&
                          relation.isMinor && (
                            <span className={clsx('text-[10px] px-1 py-0.5 rounded-full', accent.badge)}>
                              次要
                            </span>
                          )
                        )}
                      </div>
                      {isEditMode && isDirectRelation ? (
                        <EditableField
                          tag='span'
                          path={`${config.key}.${originalIndex}.description`}
                          initialValue={relation.description || ''}
                          className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                          onSave={(newValue) =>
                            relationHook.handleUpdate(originalIndex, 'description', newValue)
                          }
                        />
                      ) : (
                        !isEditMode &&
                        relation.description && (
                          <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                            {relation.description}
                          </span>
                        )
                      )}
                    </div>
                    {isEditMode && isDirectRelation && (
                      <button
                        type='button'
                        onClick={() => relationHook.handleRemove(originalIndex)}
                        className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                        aria-label={config.characterAria.remove(relation.id)}
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
              }

              if (item.type === 'knowledgeCard') {
                const cardInfo = cards[item.data.id];
                if (!cardInfo) {
                  return null;
                }
                const isMinor = !!item.data.isMinor;
                const idx = item.idx;

                return (
                  <div
                    key={`knowledgeCard-${item.data.id}`}
                    className={clsx(
                      'flex flex-row items-center gap-3 p-2 rounded-lg',
                      accent.cardBg,
                      !isEditMode && accent.cardHover,
                      isMinor && 'opacity-60'
                    )}
                    role={!isEditMode ? 'button' : undefined}
                    tabIndex={!isEditMode ? 0 : undefined}
                    aria-label={`跳转到知识卡 ${item.data.id}`}
                    onClick={() => {
                      if (!isEditMode) {
                        navigate(`/cards/${encodeURIComponent(item.data.id)}`);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
                        navigate(`/cards/${encodeURIComponent(item.data.id)}`);
                      }
                    }}
                  >
                    <Image
                      src={cardInfo.imageUrl}
                      alt={item.data.id}
                      width={32}
                      height={40}
                      className='w-8 h-10 mx-1'
                    />
                    <div className='flex flex-col flex-1'>
                      <div className='flex items-center gap-1'>
                        <span className='text-xs text-gray-700 dark:text-gray-300'>
                          {item.data.id}
                        </span>
                        {isEditMode ? (
                          <button
                            type='button'
                            onClick={() => toggleExtraMinor(item.extraKey, idx)}
                            className={clsx(
                              'text-[10px] px-1 py-0.5 rounded-full hover:bg-opacity-80 cursor-pointer',
                              accent.badge
                            )}
                            aria-label={`切换${item.data.id}的知识卡关系为${isMinor ? '主要' : '次要'}`}
                          >
                            {isMinor ? '次要' : '主要'}
                          </button>
                        ) : (
                          isMinor && (
                            <span className={clsx('text-[10px] px-1 py-0.5 rounded-full', accent.badge)}>
                              次要
                            </span>
                          )
                        )}
                      </div>
                      {isEditMode ? (
                        <EditableField
                          tag='span'
                          path={`${item.extraKey}.${idx}.description`}
                          initialValue={item.data.description || ''}
                          className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                          onSave={(newValue) => updateExtraDescription(item.extraKey, idx, newValue)}
                        />
                      ) : (
                        item.data.description && (
                          <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                            {item.data.description}
                          </span>
                        )
                      )}
                    </div>
                    {isEditMode && (
                      <button
                        type='button'
                        className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                        aria-label={`移除知识卡 ${item.data.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeExtraAt(item.extraKey, idx);
                        }}
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
              }

              if (item.type === 'specialSkill') {
                const skillInfo =
                  specialSkills[specialSkillDisplayFaction]?.[item.data.id as keyof typeof specialSkills[FactionId]] ??
                  specialSkills[specialSkillDisplayFaction]?.[item.data.id as keyof typeof specialSkills[FactionId]];
                const isMinor = !!item.data.isMinor;
                const idx = item.idx;

                return (
                  <div
                    key={`specialSkill-${item.data.id}`}
                    className={clsx(
                      'flex flex-row items-center gap-3 p-2 rounded-lg',
                      accent.cardBg,
                      !isEditMode && accent.cardHover,
                      isMinor && 'opacity-60'
                    )}
                    role={!isEditMode ? 'button' : undefined}
                    tabIndex={!isEditMode ? 0 : undefined}
                    aria-label={`跳转到特技 ${item.data.id}`}
                    onClick={() => {
                      if (!isEditMode) {
                        navigate(
                          `/special-skills/${specialSkillDisplayFaction}/${encodeURIComponent(item.data.id)}`
                        );
                      }
                    }}
                    onKeyDown={(e) => {
                      if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
                        navigate(
                          `/special-skills/${specialSkillDisplayFaction}/${encodeURIComponent(item.data.id)}`
                        );
                      }
                    }}
                  >
                    {skillInfo && skillInfo.imageUrl ? (
                      <Image
                        src={skillInfo.imageUrl}
                        alt={item.data.id}
                        width={40}
                        height={40}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                    ) : (
                      <span className='w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 text-xs'>
                        ?
                      </span>
                    )}
                    <div className='flex flex-col flex-1'>
                      <div className='flex items-center gap-1'>
                        <span className='text-xs text-gray-700 dark:text-gray-300'>
                          {item.data.id}
                        </span>
                        {isEditMode ? (
                          <button
                            type='button'
                            onClick={() => toggleExtraMinor(item.extraKey, idx)}
                            className={clsx(
                              'text-[10px] px-1 py-0.5 rounded-full hover:bg-opacity-80 cursor-pointer',
                              accent.badge
                            )}
                            aria-label={`切换${item.data.id}的特技关系为${isMinor ? '主要' : '次要'}`}
                          >
                            {isMinor ? '次要' : '主要'}
                          </button>
                        ) : (
                          isMinor && (
                            <span className={clsx('text-[10px] px-1 py-0.5 rounded-full', accent.badge)}>
                              次要
                            </span>
                          )
                        )}
                      </div>
                      {isEditMode ? (
                        <EditableField
                          tag='span'
                          path={`${item.extraKey}.${idx}.description`}
                          initialValue={item.data.description || ''}
                          className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                          onSave={(newValue) => updateExtraDescription(item.extraKey, idx, newValue)}
                        />
                      ) : (
                        item.data.description && (
                          <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                            {item.data.description}
                          </span>
                        )
                      )}
                    </div>
                    {isEditMode && (
                      <button
                        type='button'
                        className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                        aria-label={`移除特技 ${item.data.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          removeExtraAt(item.extraKey, idx);
                        }}
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
              }

              return null;
            })
          )}
        </div>
      </div>
    );
  };

  const sections: SectionConfig[] = [
    {
      key: 'counters',
      accent: 'blue',
      title: ({ id: relationId, factionId: relationFaction }) =>
        `被${relationId}克制的${relationFaction === 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
      icon: (
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          aria-label='smile'
          xmlns='http://www.w3.org/2000/svg'
        >
          <circle cx='5' cy='6' r='1.25' fill='#2563eb' />
          <circle cx='11' cy='6' r='1.25' fill='#2563eb' />
          <path d='M4 9.5 Q8 12.7 12 9.5' stroke='#2563eb' strokeWidth='2' fill='none' strokeLinecap='round' />
        </svg>
      ),
      characterAria: {
        view: (characterId) => `选择角色 ${characterId}`,
        edit: (characterId) => `克制 ${characterId} 的关系`,
        toggle: (characterId, isMinor) =>
          `切换${characterId}的克制关系为${isMinor ? '主要' : '次要'}`,
        remove: (characterId) => `移除${characterId}的克制关系`,
      },
      includeKnowledgeKey: 'countersKnowledgeCards',
      includeSpecialKey: 'countersSpecialSkills',
      selectExistingRelations: () => combinedSelectorRelations,
      knowledgeSelectorFaction: (currentFactionId) =>
        currentFactionId === 'cat' ? 'mouse' : 'cat',
      specialSkillDisplayFaction: (currentFactionId) =>
        currentFactionId === 'cat' ? 'mouse' : 'cat',
      getCharacterImage: (characterId, currentFactionId) =>
        AssetManager.getCharacterImageUrl(
          characterId,
          currentFactionId === 'cat' ? 'mouse' : 'cat'
        ),
    },
    {
      key: 'counterEachOther',
      accent: 'amber',
      title: ({ id: relationId, factionId: relationFaction }) =>
        `与${relationId}互有克制的${relationFaction === 'cat' ? '老鼠' : '猫咪'}`,
      icon: (
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          aria-label='neutral'
          xmlns='http://www.w3.org/2000/svg'
        >
          <circle cx='5' cy='6' r='1.25' fill='#ca8a04' />
          <circle cx='11' cy='6' r='1.25' fill='#ca8a04' />
          <path d='M5 11.25 L11 11.25' stroke='#ca8a04' strokeWidth='2' fill='none' strokeLinecap='round' />
        </svg>
      ),
      characterAria: {
        view: (characterId) => `选择角色 ${characterId}`,
        edit: (characterId) => `与 ${characterId} 互有克制的关系`,
        toggle: (characterId, isMinor) =>
          `切换${characterId}的互有克制关系为${isMinor ? '主要' : '次要'}`,
        remove: (characterId) => `移除${characterId}的互有克制关系`,
      },
      selectExistingRelations: () => combinedSelectorRelations,
      getCharacterImage: (characterId, currentFactionId) =>
        AssetManager.getCharacterImageUrl(
          characterId,
          currentFactionId === 'cat' ? 'mouse' : 'cat'
        ),
    },
    {
      key: 'counteredBy',
      accent: 'red',
      title: ({ id: relationId, factionId: relationFaction }) =>
        `克制${relationId}的${relationFaction === 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
      icon: (
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          aria-label='sad'
          xmlns='http://www.w3.org/2000/svg'
        >
          <circle cx='5' cy='6' r='1.25' fill='#dc2626' />
          <circle cx='11' cy='6' r='1.25' fill='#dc2626' />
          <path d='M4 11 Q8 9.5 12 11' stroke='#dc2626' strokeWidth='2' fill='none' strokeLinecap='round' />
        </svg>
      ),
      characterAria: {
        view: (characterId) => `选择角色 ${characterId}`,
        edit: (characterId) => `被 ${characterId} 克制的关系`,
        toggle: (characterId, isMinor) =>
          `切换${characterId}的被克制关系为${isMinor ? '主要' : '次要'}`,
        remove: (characterId) => `移除${characterId}的被克制关系`,
      },
      includeKnowledgeKey: 'counteredByKnowledgeCards',
      includeSpecialKey: 'counteredBySpecialSkills',
      selectExistingRelations: () => combinedSelectorRelations,
      knowledgeSelectorFaction: (currentFactionId) =>
        currentFactionId === 'cat' ? 'mouse' : 'cat',
      specialSkillDisplayFaction: (currentFactionId) =>
        currentFactionId === 'cat' ? 'mouse' : 'cat',
      getCharacterImage: (characterId, currentFactionId) =>
        AssetManager.getCharacterImageUrl(
          characterId,
          currentFactionId === 'cat' ? 'mouse' : 'cat'
        ),
    },
    {
      key: 'collaborators',
      accent: 'green',
      title: ({ id: relationId }) => `与${relationId}协作的老鼠`,
      icon: (
        <svg
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          aria-label='heart'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            d='M8 13 C8 13 3.5 10.5 3.5 7.5 C3.5 6 4.7 4.8 6.2 4.8 C7.1 4.8 7.8 5.2 8 5.9 C8.2 5.2 8.9 4.8 9.8 4.8 C11.3 4.8 12.5 6 12.5 7.5 C12.5 10.5 8 13 8 13 Z'
            fill='#bbf7d0'
            stroke='#16a34a'
            strokeWidth='1.8'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      ),
      characterAria: {
        view: (characterId) => `选择角色 ${characterId}`,
        edit: (characterId) => `与 ${characterId} 的协作关系`,
        toggle: (characterId, isMinor) =>
          `切换${characterId}的协作关系为${isMinor ? '主要' : '次要'}`,
        remove: (characterId) => `移除${characterId}的协作关系`,
      },
      show: (currentFactionId) => currentFactionId === 'mouse',
      getCharacterImage: (characterId) => AssetManager.getCharacterImageUrl(characterId, 'mouse'),
    },
  ];

  const updateExtraArray = useCallback(
    (
      key: ExtraRelationKey,
      updater: (items: CharacterRelationItem[]) => CharacterRelationItem[]
    ) => {
      const current = Array.from((localExtra[key] ?? []) as readonly CharacterRelationItem[]);
      const updated = updater(current);
      setNestedProperty(characters, `${characterId}.${key}`, updated);
    },
    [characterId, localExtra]
  );

  const toggleExtraMinor = useCallback(
    (key: ExtraRelationKey, idx: number) =>
      updateExtraArray(key, (items) => {
        const item = items[idx];
        if (!item) return items;
        const next = [...items];
        next[idx] = { ...item, isMinor: !item.isMinor };
        return next;
      }),
    [updateExtraArray]
  );

  const updateExtraDescription = useCallback(
    (key: ExtraRelationKey, idx: number, description: string) =>
      updateExtraArray(key, (items) => {
        const item = items[idx];
        if (!item) return items;
        const next = [...items];
        next[idx] = { ...item, description };
        return next;
      }),
    [updateExtraArray]
  );

  const removeExtraAt = useCallback(
    (key: ExtraRelationKey, idx: number) =>
      updateExtraArray(key, (items) => items.filter((_, i) => i !== idx)),
    [updateExtraArray]
  );

  const addExtraItem = useCallback(
    (key: ExtraRelationKey, id: string, description = '新增关系描述', isMinor = false) =>
      updateExtraArray(key, (items) => [...items, { id, description, isMinor }]),
    [updateExtraArray]
  );

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
                  aria-label='smile'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <circle cx='5' cy='6' r='1.25' fill='#2563eb' />
                  <circle cx='11' cy='6' r='1.25' fill='#2563eb' />
                  <path
                    d='M4 9.5 Q8 12.7 12 9.5'
                    stroke='#2563eb'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                  />
                </svg>
              </span>
              被{id}克制的{factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技
            </span>
            {isEditMode && (
              <div className='flex gap-2'>
                <CharacterSelector
                  currentCharacterId={id}
                  factionId={factionId}
                  relationType='counters'
                  existingRelations={combinedSelectorRelations}
                  onSelect={(characterId) => countersHook.handleAdd(characterId, '新增关系描述')}
                />
                <KnowledgeCardSelector
                  selected={Array.from(localCharacter.countersKnowledgeCards ?? [])}
                  onSelect={(cardName) =>
                    addExtraItem('countersKnowledgeCards', cardName as string)
                  }
                  factionId={factionId == 'cat' ? 'mouse' : 'cat'}
                />
                <SpecialSkillSelector
                  selected={Array.from(localCharacter.countersSpecialSkills ?? [])}
                  factionId={factionId}
                  onSelect={(skillName) =>
                    addExtraItem('countersSpecialSkills', skillName as string)
                  }
                />
              </div>
            )}
          </div>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counters.length === 0 &&
            (!localCharacter.countersKnowledgeCards ||
              localCharacter.countersKnowledgeCards.length === 0) &&
            (!localCharacter.countersSpecialSkills ||
              localCharacter.countersSpecialSkills.length === 0) &&
            !isEditMode ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              [
                ...char.counters.map((c) => ({
                  ...c,
                  _type: 'character',
                })),
                ...(localCharacter.countersKnowledgeCards ?? []).map((card, idx) => ({
                  ...card,
                  _type: 'knowledgeCard',
                  _idx: idx,
                })),
                ...(localCharacter.countersSpecialSkills ?? []).map((skill, idx) => ({
                  ...skill,
                  _type: 'specialSkill',
                  _idx: idx,
                })),
              ]
                .sort((a, b) => (a.isMinor === b.isMinor ? 0 : a.isMinor ? 1 : -1))
                .map((item) => {
                  if (item._type === 'character') {
                    // Character relation
                    const c = item;
                    const originalIndex = isEditMode
                      ? (localCharacter.counters || []).findIndex((oc) => oc.id === c.id)
                      : -1;
                    const isDirectRelation = originalIndex !== -1;
                    return (
                      <div
                        key={'character-' + c.id}
                        className={clsx(
                          'flex flex-row items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30',
                          !isEditMode &&
                            'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95',
                          c.isMinor && 'opacity-60'
                        )}
                        {...(!isEditMode && { role: 'button', tabIndex: 0 })}
                        aria-label={!isEditMode ? `选择角色 ${c.id}` : `克制 ${c.id} 的关系`}
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
                        <Image
                          src={getImageUrl(c.id)}
                          alt={c.id}
                          width={40}
                          height={40}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                        <div className='flex flex-col flex-1'>
                          <div className='flex items-center gap-1'>
                            <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                            {isEditMode && isDirectRelation ? (
                              <button
                                type='button'
                                onClick={() => countersHook.toggleIsMinor(originalIndex)}
                                className='text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer'
                                aria-label={`切换${c.id}的克制关系为${c.isMinor ? '主要' : '次要'}`}
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
                            aria-label={`移除${c.id}的克制关系`}
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
                  } else if (item._type === 'knowledgeCard') {
                    // Knowledge card relation
                    const card = item as typeof item & { _idx: number };
                    const cardObj = cards[card.id];
                    if (!cardObj) return null;
                    const isMinor = !!card.isMinor;
                    const idx = card._idx;
                    return (
                      <div
                        key={'knowledgeCard-' + card.id}
                        className={clsx(
                          'flex flex-row items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30',
                          !isEditMode &&
                            'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95',
                          isMinor && 'opacity-60'
                        )}
                        role={!isEditMode ? 'button' : undefined}
                        tabIndex={!isEditMode ? 0 : undefined}
                        aria-label={`跳转到知识卡 ${card.id}`}
                        onClick={() => {
                          if (!isEditMode) {
                            navigate(`/cards/${encodeURIComponent(card.id)}`);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
                            navigate(`/cards/${encodeURIComponent(card.id)}`);
                          }
                        }}
                      >
                        <Image
                          src={cardObj.imageUrl}
                          alt={card.id}
                          width={32}
                          height={40}
                          className='w-8 h-10 mx-1'
                        />
                        <div className='flex flex-col flex-1'>
                          <div className='flex items-center gap-1'>
                            <span className='text-xs text-gray-700 dark:text-gray-300'>
                              {card.id}
                            </span>
                            {isEditMode ? (
                              <button
                                type='button'
                                onClick={() => toggleExtraMinor('countersKnowledgeCards', idx)}
                                className='text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer'
                                aria-label={`切换${card.id}的知识卡关系为${isMinor ? '主要' : '次要'}`}
                              >
                                {isMinor ? '次要' : '主要'}
                              </button>
                            ) : (
                              isMinor && (
                                <span className='text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full'>
                                  次要
                                </span>
                              )
                            )}
                          </div>
                          {isEditMode ? (
                            <EditableField
                              tag='span'
                              path={`countersKnowledgeCards.${idx}.description`}
                              initialValue={card.description || ''}
                              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                              onSave={(newValue) =>
                                updateExtraDescription('countersKnowledgeCards', idx, newValue)
                              }
                            />
                          ) : (
                            card.description && (
                              <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                                {card.description}
                              </span>
                            )
                          )}
                        </div>
                        {isEditMode && (
                          <button
                            type='button'
                            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                            aria-label={`移除知识卡 ${card.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExtraAt('countersKnowledgeCards', idx);
                            }}
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
                  } else if (item._type === 'specialSkill') {
                    // Special skill relation
                    const skill = item as typeof item & { _idx: number };
                    const oppositeFactionId = factionId == 'cat' ? 'mouse' : 'cat';
                    const skillObj = specialSkills[oppositeFactionId][skill.id];
                    const isMinor = !!skill.isMinor;
                    const idx = skill._idx;
                    return (
                      <div
                        key={'specialSkill-' + skill.id}
                        className={clsx(
                          'flex flex-row items-center gap-3 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30',
                          !isEditMode &&
                            'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95',
                          isMinor && 'opacity-60'
                        )}
                        role={!isEditMode ? 'button' : undefined}
                        tabIndex={!isEditMode ? 0 : undefined}
                        aria-label={`跳转到特技 ${skill.id}`}
                        onClick={() => {
                          if (!isEditMode) {
                            navigate(
                              `/special-skills/${oppositeFactionId}/${encodeURIComponent(skill.id)}`
                            );
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
                            navigate(
                              `/special-skills/${oppositeFactionId}/${encodeURIComponent(skill.id)}`
                            );
                          }
                        }}
                      >
                        {skillObj && skillObj.imageUrl ? (
                          <Image
                            src={skillObj.imageUrl}
                            alt={skill.id}
                            width={40}
                            height={40}
                            className='w-10 h-10 rounded-full object-cover'
                          />
                        ) : (
                          <span className='w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 text-xs'>
                            ?
                          </span>
                        )}
                        <div className='flex flex-col flex-1'>
                          <div className='flex items-center gap-1'>
                            <span className='text-xs text-gray-700 dark:text-gray-300'>
                              {skill.id}
                            </span>
                            {isEditMode ? (
                              <button
                                type='button'
                                onClick={() => toggleExtraMinor('countersSpecialSkills', idx)}
                                className='text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer'
                                aria-label={`切换${skill.id}的特技关系为${isMinor ? '主要' : '次要'}`}
                              >
                                {isMinor ? '次要' : '主要'}
                              </button>
                            ) : (
                              isMinor && (
                                <span className='text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full'>
                                  次要
                                </span>
                              )
                            )}
                          </div>
                          {isEditMode ? (
                            <EditableField
                              tag='span'
                              path={`countersSpecialSkills.${idx}.description`}
                              initialValue={skill.description || ''}
                              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                              onSave={(newValue) =>
                                updateExtraDescription('countersSpecialSkills', idx, newValue)
                              }
                            />
                          ) : (
                            skill.description && (
                              <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                                {skill.description}
                              </span>
                            )
                          )}
                        </div>
                        {isEditMode && (
                          <button
                            type='button'
                            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                            aria-label={`移除特技 ${skill.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExtraAt('countersSpecialSkills', idx);
                            }}
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
                  }
                  return null;
                })
            )}
          </div>
        </div>

        {/*counterEachOther*/}
        <div>
          <div className='flex items-center justify-between'>
            <span className='font-semibold text-sm text-amber-700 dark:text-amber-300 flex items-center gap-1'>
              <span className='w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center mr-1'>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  aria-label='sad'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <circle cx='5' cy='6' r='1.25' fill='#ca8a04' />
                  <circle cx='11' cy='6' r='1.25' fill='#ca8a04' />
                  <path
                    d='M5 11.25 L11 11.25'
                    stroke='#ca8a04'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                  />
                </svg>
              </span>
              与{id}互有克制的{factionId == 'cat' ? '老鼠' : '猫咪'}
            </span>
            {isEditMode && (
              <div className='flex gap-2'>
                <CharacterSelector
                  currentCharacterId={id}
                  factionId={factionId}
                  relationType='counterEachOther'
                  existingRelations={[
                    ...getCharacterRelation(id).counters,
                    ...getCharacterRelation(id).counteredBy,
                    ...getCharacterRelation(id).counterEachOther,
                  ]}
                  onSelect={(characterId) =>
                    counterEachOtherHook.handleAdd(characterId, '新增关系描述')
                  }
                />
              </div>
            )}
          </div>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counterEachOther.length === 0 && !isEditMode ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              [
                ...char.counterEachOther.map((c) => ({
                  ...c,
                  _type: 'character',
                })),
              ]
                .sort((a, b) => (a.isMinor === b.isMinor ? 0 : a.isMinor ? 1 : -1))
                .map((item) => {
                  if (item._type === 'character') {
                    // Character relation
                    const c = item;
                    const originalIndex = isEditMode
                      ? (localCharacter.counterEachOther || []).findIndex((oc) => oc.id === c.id)
                      : -1;
                    const isDirectRelation = originalIndex !== -1;
                    return (
                      <div
                        key={'character-' + c.id}
                        className={clsx(
                          'flex flex-row items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30',
                          !isEditMode &&
                            'cursor-pointer transition-shadow hover:shadow-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-95',
                          c.isMinor && 'opacity-60'
                        )}
                        {...(!isEditMode && { role: 'button', tabIndex: 0 })}
                        aria-label={!isEditMode ? `选择角色 ${c.id}` : `与 ${c.id} 互有克制的关系`}
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
                        <Image
                          src={getImageUrl(c.id)}
                          alt={c.id}
                          width={40}
                          height={40}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                        <div className='flex flex-col flex-1'>
                          <div className='flex items-center gap-1'>
                            <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                            {isEditMode && isDirectRelation ? (
                              <button
                                type='button'
                                onClick={() => counterEachOtherHook.toggleIsMinor(originalIndex)}
                                className='text-[10px] px-1 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full hover:bg-amber-300 dark:hover:bg-amber-600 cursor-pointer'
                                aria-label={`切换${c.id}的互有克制关系为${c.isMinor ? '主要' : '次要'}`}
                              >
                                {c.isMinor ? '次要' : '主要'}
                              </button>
                            ) : (
                              !isEditMode &&
                              c.isMinor && (
                                <span className='text-[10px] px-1 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full'>
                                  次要
                                </span>
                              )
                            )}
                          </div>
                          {isEditMode && isDirectRelation ? (
                            <EditableField
                              tag='span'
                              path={`counterEachOther.${originalIndex}.description`}
                              initialValue={c.description || ''}
                              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                              onSave={(newValue) =>
                                counterEachOtherHook.handleUpdate(
                                  originalIndex,
                                  'description',
                                  newValue
                                )
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
                            onClick={() => counterEachOtherHook.handleRemove(originalIndex)}
                            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                            aria-label={`移除${c.id}的互有克制关系`}
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
                  }
                  return null;
                })
            )}
          </div>
        </div>

        {/* Combined Countered By (Characters + Knowledge Cards + Special Skills) */}
        <div>
          <div className='flex items-center justify-between'>
            <span className='font-semibold text-sm text-red-700 dark:text-red-300 flex items-center gap-1'>
              <span className='w-5 h-5 bg-red-200 rounded-full flex items-center justify-center mr-1'>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  aria-label='sad'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <circle cx='5' cy='6' r='1.25' fill='#dc2626' />
                  <circle cx='11' cy='6' r='1.25' fill='#dc2626' />
                  <path
                    d='M4 11 Q8 9.5 12 11'
                    stroke='#dc2626'
                    strokeWidth='2'
                    fill='none'
                    strokeLinecap='round'
                  />
                </svg>
              </span>
              克制{id}的{factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技
            </span>
            {isEditMode && (
              <div className='flex gap-2'>
                <CharacterSelector
                  currentCharacterId={id}
                  factionId={factionId}
                  relationType='counteredBy'
                  existingRelations={[
                    ...getCharacterRelation(id).counters,
                    ...getCharacterRelation(id).counteredBy,
                    ...getCharacterRelation(id).counterEachOther,
                  ]}
                  onSelect={(characterId) => counteredByHook.handleAdd(characterId, '新增关系描述')}
                />
                <KnowledgeCardSelector
                  selected={Array.from(localCharacter.counteredByKnowledgeCards ?? [])}
                  onSelect={(cardName) =>
                    addExtraItem('counteredByKnowledgeCards', cardName as string)
                  }
                  factionId={factionId == 'cat' ? 'mouse' : 'cat'}
                />
                <SpecialSkillSelector
                  selected={Array.from(localCharacter.counteredBySpecialSkills ?? [])}
                  factionId={factionId}
                  onSelect={(skillName) =>
                    addExtraItem('counteredBySpecialSkills', skillName as string)
                  }
                />
              </div>
            )}
          </div>
          <div className='grid grid-cols-1 gap-y-3 mt-2'>
            {char.counteredBy.length === 0 &&
            (!localCharacter.counteredByKnowledgeCards ||
              localCharacter.counteredByKnowledgeCards.length === 0) &&
            (!localCharacter.counteredBySpecialSkills ||
              localCharacter.counteredBySpecialSkills.length === 0) &&
            !isEditMode ? (
              <span className='text-xs text-gray-400'>无</span>
            ) : (
              [
                ...char.counteredBy.map((c) => ({
                  ...c,
                  _type: 'character',
                })),
                ...(localCharacter.counteredByKnowledgeCards ?? []).map((card, idx) => ({
                  ...card,
                  _type: 'knowledgeCard',
                  _idx: idx,
                })),
                ...(localCharacter.counteredBySpecialSkills ?? []).map((skill, idx) => ({
                  ...skill,
                  _type: 'specialSkill',
                  _idx: idx,
                })),
              ]
                .sort((a, b) => (a.isMinor === b.isMinor ? 0 : a.isMinor ? 1 : -1))
                .map((item) => {
                  if (item._type === 'character') {
                    // Character relation
                    const c = item;
                    const originalIndex = isEditMode
                      ? (localCharacter.counteredBy || []).findIndex((oc) => oc.id === c.id)
                      : -1;
                    const isDirectRelation = originalIndex !== -1;
                    return (
                      <div
                        key={'character-' + c.id}
                        className={clsx(
                          'flex flex-row items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/30',
                          !isEditMode &&
                            'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95',
                          c.isMinor && 'opacity-60'
                        )}
                        {...(!isEditMode && { role: 'button', tabIndex: 0 })}
                        aria-label={!isEditMode ? `选择角色 ${c.id}` : `被 ${c.id} 克制的关系`}
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
                        <Image
                          src={getImageUrl(c.id)}
                          alt={c.id}
                          width={40}
                          height={40}
                          className='w-10 h-10 rounded-full object-cover'
                        />
                        <div className='flex flex-col flex-1'>
                          <div className='flex items-center gap-1'>
                            <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                            {isEditMode && isDirectRelation ? (
                              <button
                                type='button'
                                onClick={() => counteredByHook.toggleIsMinor(originalIndex)}
                                className='text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full hover:bg-red-300 dark:hover:bg-red-600 cursor-pointer'
                                aria-label={`切换${c.id}的被克制关系为${c.isMinor ? '主要' : '次要'}`}
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
                            aria-label={`移除${c.id}的被克制关系`}
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
                  } else if (item._type === 'knowledgeCard') {
                    // Knowledge card relation
                    const card = item as typeof item & { _idx: number };
                    const cardObj = cards[card.id];
                    if (!cardObj) return null;
                    const isMinor = !!card.isMinor;
                    const idx = card._idx;
                    return (
                      <div
                        key={'knowledgeCard-' + card.id}
                        className={clsx(
                          'flex flex-row items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/30',
                          !isEditMode &&
                            'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95',
                          isMinor && 'opacity-60'
                        )}
                        role={!isEditMode ? 'button' : undefined}
                        tabIndex={!isEditMode ? 0 : undefined}
                        aria-label={`跳转到知识卡 ${card.id}`}
                        onClick={() => {
                          if (!isEditMode) {
                            navigate(`/cards/${encodeURIComponent(card.id)}`);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
                            navigate(`/cards/${encodeURIComponent(card.id)}`);
                          }
                        }}
                      >
                        <Image
                          src={cardObj.imageUrl}
                          alt={card.id}
                          width={32}
                          height={40}
                          className='w-8 h-10 mx-1'
                        />
                        <div className='flex flex-col flex-1'>
                          <div className='flex items-center gap-1'>
                            <span className='text-xs text-gray-700 dark:text-gray-300'>
                              {card.id}
                            </span>
                            {isEditMode ? (
                              <button
                                type='button'
                                onClick={() => toggleExtraMinor('counteredByKnowledgeCards', idx)}
                                className='text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full hover:bg-red-300 dark:hover:bg-red-600 cursor-pointer'
                                aria-label={`切换${card.id}的知识卡关系为${isMinor ? '主要' : '次要'}`}
                              >
                                {isMinor ? '次要' : '主要'}
                              </button>
                            ) : (
                              isMinor && (
                                <span className='text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full'>
                                  次要
                                </span>
                              )
                            )}
                          </div>
                          {isEditMode ? (
                            <EditableField
                              tag='span'
                              path={`counteredByKnowledgeCards.${idx}.description`}
                              initialValue={card.description || ''}
                              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                              onSave={(newValue) =>
                                updateExtraDescription('counteredByKnowledgeCards', idx, newValue)
                              }
                            />
                          ) : (
                            card.description && (
                              <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                                {card.description}
                              </span>
                            )
                          )}
                        </div>
                        {isEditMode && (
                          <button
                            type='button'
                            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                            aria-label={`移除知识卡 ${card.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExtraAt('counteredByKnowledgeCards', idx);
                            }}
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
                  } else if (item._type === 'specialSkill') {
                    // Special skill relation
                    const skill = item as typeof item & { _idx: number };
                    const oppositeFactionId = factionId == 'cat' ? 'mouse' : 'cat';
                    const skillObj = specialSkills[oppositeFactionId][skill.id];
                    const isMinor = !!skill.isMinor;
                    const idx = skill._idx;
                    return (
                      <div
                        key={'specialSkill-' + skill.id}
                        className={clsx(
                          'flex flex-row items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/30',
                          !isEditMode &&
                            'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95',
                          isMinor && 'opacity-60'
                        )}
                        role={!isEditMode ? 'button' : undefined}
                        tabIndex={!isEditMode ? 0 : undefined}
                        aria-label={`跳转到特技 ${skill.id}`}
                        onClick={() => {
                          if (!isEditMode) {
                            navigate(
                              `/special-skills/${oppositeFactionId}/${encodeURIComponent(skill.id)}`
                            );
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
                            navigate(
                              `/special-skills/${oppositeFactionId}/${encodeURIComponent(skill.id)}`
                            );
                          }
                        }}
                      >
                        {skillObj && skillObj.imageUrl ? (
                          <Image
                            src={skillObj.imageUrl}
                            alt={skill.id}
                            width={40}
                            height={40}
                            className='w-10 h-10 rounded-full object-cover'
                          />
                        ) : (
                          <span className='w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-pink-600 text-xs'>
                            ?
                          </span>
                        )}
                        <div className='flex flex-col flex-1'>
                          <div className='flex items-center gap-1'>
                            <span className='text-xs text-gray-700 dark:text-gray-300'>
                              {skill.id}
                            </span>
                            {isEditMode ? (
                              <button
                                type='button'
                                onClick={() => toggleExtraMinor('counteredBySpecialSkills', idx)}
                                className='text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full hover:bg-red-300 dark:hover:bg-red-600 cursor-pointer'
                                aria-label={`切换${skill.id}的特技关系为${isMinor ? '主要' : '次要'}`}
                              >
                                {isMinor ? '次要' : '主要'}
                              </button>
                            ) : (
                              isMinor && (
                                <span className='text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full'>
                                  次要
                                </span>
                              )
                            )}
                          </div>
                          {isEditMode ? (
                            <EditableField
                              tag='span'
                              path={`counteredBySpecialSkills.${idx}.description`}
                              initialValue={skill.description || ''}
                              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
                              onSave={(newValue) =>
                                updateExtraDescription('counteredBySpecialSkills', idx, newValue)
                              }
                            />
                          ) : (
                            skill.description && (
                              <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                                {skill.description}
                              </span>
                            )
                          )}
                        </div>
                        {isEditMode && (
                          <button
                            type='button'
                            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                            aria-label={`移除特技 ${skill.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExtraAt('counteredBySpecialSkills', idx);
                            }}
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
                  }
                  return null;
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
                    aria-label='heart'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M8 13 C8 13 3.5 10.5 3.5 7.5 C3.5 6 4.7 4.8 6.2 4.8 C7.1 4.8 7.8 5.2 8 5.9 C8.2 5.2 8.9 4.8 9.8 4.8 C11.3 4.8 12.5 6 12.5 7.5 C12.5 10.5 8 13 8 13 Z'
                      fill='#bbf7d0'
                      stroke='#16a34a'
                      strokeWidth='1.8'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </span>
                与{id}协作的老鼠
              </span>
              {isEditMode && (
                <CharacterSelector
                  currentCharacterId={id}
                  factionId={factionId}
                  relationType='collaborators'
                  existingRelations={getCharacterRelation(id).collaborators}
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
                      className={clsx(
                        'flex flex-row items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/30',
                        !isEditMode &&
                          'cursor-pointer transition-shadow hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95',
                        c.isMinor && 'opacity-60'
                      )}
                      {...(!isEditMode && { role: 'button', tabIndex: 0 })}
                      aria-label={!isEditMode ? `选择角色 ${c.id}` : `与 ${c.id} 的协作关系`}
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
                      <Image
                        src={AssetManager.getCharacterImageUrl(c.id, 'mouse')}
                        alt={c.id}
                        width={40}
                        height={40}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                      <div className='flex flex-col flex-1'>
                        <div className='flex items-center gap-1'>
                          <span className='text-xs text-gray-700 dark:text-gray-300'>{c.id}</span>
                          {isEditMode && isDirectRelation ? (
                            <button
                              type='button'
                              onClick={() => collaboratorsHook.toggleIsMinor(originalIndex)}
                              className='text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full hover:bg-green-300 dark:hover:bg-green-600 cursor-pointer'
                              aria-label={`切换${c.id}的协作关系为${c.isMinor ? '主要' : '次要'}`}
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
                          aria-label={`移除${c.id}的协作关系`}
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
