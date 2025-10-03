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
import { HappyFaceIcon, NeutralFaceIcon, SadFaceIcon, HeartIcon } from './CharacterRelationIcons';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

type Props = {
  id: string;
  factionId: FactionId;
};

// Lightweight generic hook to manage character relation arrays
type RelationKey = 'counters' | 'counteredBy' | 'counterEachOther' | 'collaborators';
type ExtraRelationKey =
  | 'countersKnowledgeCards'
  | 'counteredByKnowledgeCards'
  | 'countersSpecialSkills'
  | 'counteredBySpecialSkills';

type RelationCollectionKey = RelationKey | ExtraRelationKey;
type RelationCollections = Partial<Record<RelationCollectionKey, readonly CharacterRelationItem[]>>;

type RelationTheme = 'blue' | 'amber' | 'red' | 'green';

type RelationThemeClasses = {
  headerText: string;
  iconBg: string;
  itemBg: string;
  interactive: string;
  toggle: string;
  badge: string;
};

const relationThemeClasses: Record<RelationTheme, RelationThemeClasses> = {
  blue: {
    headerText: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-200',
    itemBg: 'bg-blue-50 dark:bg-blue-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-300 dark:hover:bg-blue-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full',
  },
  amber: {
    headerText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-200',
    itemBg: 'bg-amber-50 dark:bg-amber-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full hover:bg-amber-300 dark:hover:bg-amber-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-amber-200 dark:bg-amber-700 text-amber-800 dark:text-amber-200 rounded-full',
  },
  red: {
    headerText: 'text-red-700 dark:text-red-300',
    iconBg: 'bg-red-200',
    itemBg: 'bg-red-50 dark:bg-red-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-red-100 dark:hover:bg-red-800/40 focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full hover:bg-red-300 dark:hover:bg-red-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-200 rounded-full',
  },
  green: {
    headerText: 'text-green-700 dark:text-green-300',
    iconBg: 'bg-green-200',
    itemBg: 'bg-green-50 dark:bg-green-900/30',
    interactive:
      'cursor-pointer transition-shadow hover:shadow-lg hover:bg-green-100 dark:hover:bg-green-800/40 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95',
    toggle:
      'text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full hover:bg-green-300 dark:hover:bg-green-600 cursor-pointer',
    badge:
      'text-[10px] px-1 py-0.5 bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full',
  },
};

type CharacterDisplayItem = {
  type: 'character';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageSrc: string;
  getAriaLabel: (isEditMode: boolean) => string;
  onNavigate: () => void;
  showEditable: boolean;
  editablePath?: string;
  onUpdateDescription?: (value: string) => void;
  onToggleMinor?: () => void;
  getToggleLabel?: (currentIsMinor: boolean) => string;
  onRemove?: () => void;
  getRemoveLabel?: () => string;
};

type KnowledgeCardDisplayItem = {
  type: 'knowledgeCard';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageUrl: string;
  ariaLabel: string;
  onNavigate: () => void;
  editablePath: string;
  onUpdateDescription: (value: string) => void;
  onToggleMinor: () => void;
  getToggleLabel: (currentIsMinor: boolean) => string;
  onRemove: () => void;
  removeLabel: string;
};

type SpecialSkillDisplayItem = {
  type: 'specialSkill';
  key: string;
  id: string;
  description: string;
  isMinor: boolean;
  imageUrl?: string;
  ariaLabel: string;
  onNavigate: () => void;
  editablePath: string;
  onUpdateDescription: (value: string) => void;
  onToggleMinor: () => void;
  getToggleLabel: (currentIsMinor: boolean) => string;
  onRemove: () => void;
  removeLabel: string;
};

type RelationDisplayItem =
  | CharacterDisplayItem
  | KnowledgeCardDisplayItem
  | SpecialSkillDisplayItem;

type RelationSectionConfig = {
  key: string;
  theme: RelationTheme;
  title: string;
  icon: React.ReactNode;
  items: RelationDisplayItem[];
  selectors?: React.ReactNode;
  show?: boolean;
};

const toArray = <T,>(value: readonly T[] | undefined | null): T[] =>
  value ? Array.from(value) : [];

const sortByImportance = <T extends { isMinor?: boolean }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const aMinor = !!a.isMinor;
    const bMinor = !!b.isMinor;
    if (aMinor === bMinor) return 0;
    return aMinor ? 1 : -1;
  });

const buildCharacterItems = (
  relationKey: RelationKey,
  combined: readonly CharacterRelationItem[],
  local: readonly CharacterRelationItem[] | undefined,
  hook: ReturnType<typeof useRelationEditor>,
  getImageUrl: (id: string) => string,
  handleSelectCharacter: (id: string) => void,
  ariaLabels: { view: (id: string) => string; edit: (id: string) => string },
  toggleLabel: (id: string, isMinor: boolean) => string,
  removeLabel: (id: string) => string
): CharacterDisplayItem[] => {
  const localArray = toArray(local);
  return combined.map((item) => {
    const id = item.id;
    const originalIndex = localArray.findIndex((localItem) => localItem.id === id);
    const isDirectRelation = originalIndex !== -1;
    const directRecord = localArray[originalIndex];
    const currentIsMinor = !!(directRecord?.isMinor ?? item.isMinor);

    return {
      type: 'character',
      key: `character-${id}`,
      id,
      description: item.description ?? '',
      isMinor: currentIsMinor,
      imageSrc: getImageUrl(id),
      getAriaLabel: (isEditMode) => (isEditMode ? ariaLabels.edit(id) : ariaLabels.view(id)),
      onNavigate: () => handleSelectCharacter(id),
      showEditable: isDirectRelation,
      ...(isDirectRelation && {
        editablePath: `${relationKey}.${originalIndex}.description`,
        onUpdateDescription: (value: string) =>
          hook.handleUpdate(originalIndex, 'description', value),
        onToggleMinor: () => hook.toggleIsMinor(originalIndex),
        getToggleLabel: (stateIsMinor: boolean) => toggleLabel(id, stateIsMinor),
        onRemove: () => hook.handleRemove(originalIndex),
        getRemoveLabel: () => removeLabel(id),
      }),
    } satisfies CharacterDisplayItem;
  });
};

const buildKnowledgeCardItems = (
  items: readonly CharacterRelationItem[] | undefined,
  descriptionPathPrefix: ExtraRelationKey,
  hook: ReturnType<typeof useRelationEditor>,
  navigateToCard: (id: string) => void
): KnowledgeCardDisplayItem[] =>
  toArray(items)
    .map((card, idx) => {
      const cardObj = cards[card.id];
      if (!cardObj) return null;
      return {
        type: 'knowledgeCard',
        key: `knowledgeCard-${card.id}`,
        id: card.id,
        description: card.description ?? '',
        isMinor: !!card.isMinor,
        imageUrl: cardObj.imageUrl,
        ariaLabel: `跳转到知识卡 ${card.id}`,
        onNavigate: () => navigateToCard(card.id),
        editablePath: `${descriptionPathPrefix}.${idx}.description`,
        onUpdateDescription: (value: string) => hook.handleUpdate(idx, 'description', value),
        onToggleMinor: () => hook.toggleIsMinor(idx),
        getToggleLabel: (currentIsMinor) =>
          `切换${card.id}的知识卡关系为${currentIsMinor ? '主要' : '次要'}`,
        onRemove: () => hook.handleRemove(idx),
        removeLabel: `移除知识卡 ${card.id}`,
      } satisfies KnowledgeCardDisplayItem;
    })
    .filter(Boolean) as KnowledgeCardDisplayItem[];

const buildSpecialSkillItems = (
  items: readonly CharacterRelationItem[] | undefined,
  descriptionPathPrefix: ExtraRelationKey,
  hook: ReturnType<typeof useRelationEditor>,
  navigateToSkill: (id: string) => void,
  targetFaction: FactionId
): SpecialSkillDisplayItem[] =>
  toArray(items).map((skill, idx) => {
    const skillObj = specialSkills[targetFaction]?.[skill.id];
    return {
      type: 'specialSkill',
      key: `specialSkill-${skill.id}`,
      id: skill.id,
      description: skill.description ?? '',
      isMinor: !!skill.isMinor,
      ...(skillObj?.imageUrl ? { imageUrl: skillObj.imageUrl } : {}),
      ariaLabel: `跳转到特技 ${skill.id}`,
      onNavigate: () => navigateToSkill(skill.id),
      editablePath: `${descriptionPathPrefix}.${idx}.description`,
      onUpdateDescription: (value: string) => hook.handleUpdate(idx, 'description', value),
      onToggleMinor: () => hook.toggleIsMinor(idx),
      getToggleLabel: (currentIsMinor) =>
        `切换${skill.id}的特技关系为${currentIsMinor ? '主要' : '次要'}`,
      onRemove: () => hook.handleRemove(idx),
      removeLabel: `移除特技 ${skill.id}`,
    } satisfies SpecialSkillDisplayItem;
  });

type RelationSectionProps = {
  title: string;
  icon: React.ReactNode;
  theme: RelationTheme;
  items: RelationDisplayItem[];
  selectors?: React.ReactNode;
  isEditMode: boolean;
  emptyLabel?: string;
};

const RelationSection: React.FC<RelationSectionProps> = ({
  title,
  icon,
  theme,
  items,
  selectors,
  isEditMode,
  emptyLabel = '无',
}) => {
  const themeClasses = relationThemeClasses[theme];

  const renderCharacterItem = (item: CharacterDisplayItem) => {
    const ariaLabel = item.getAriaLabel(isEditMode);
    const handleClick = () => {
      if (!isEditMode) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 p-2 rounded-lg',
          themeClasses.itemBg,
          !isEditMode && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        {...(!isEditMode && { role: 'button', tabIndex: 0 })}
        aria-label={ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        <Image
          src={item.imageSrc}
          alt={item.id}
          width={40}
          height={40}
          className='w-10 h-10 rounded-full object-cover'
        />
        <div className='flex flex-col flex-1'>
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {isEditMode && item.showEditable ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel?.(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              !isEditMode && item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {isEditMode && item.showEditable ? (
            <EditableField
              tag='span'
              path={item.editablePath!}
              initialValue={item.description || ''}
              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
              onSave={item.onUpdateDescription!}
            />
          ) : (
            !isEditMode &&
            item.description && (
              <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                {item.description}
              </span>
            )
          )}
        </div>
        {isEditMode && item.showEditable && item.onRemove && (
          <button
            type='button'
            onClick={item.onRemove}
            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            aria-label={item.getRemoveLabel?.()}
          >
            <TrashIcon className='w-4 h-4' aria-hidden='true' />
          </button>
        )}
      </div>
    );
  };

  const renderKnowledgeCardItem = (item: KnowledgeCardDisplayItem) => {
    const handleClick = () => {
      if (!isEditMode) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 p-2 rounded-lg',
          themeClasses.itemBg,
          !isEditMode && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        role={!isEditMode ? 'button' : undefined}
        tabIndex={!isEditMode ? 0 : undefined}
        aria-label={item.ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        <Image src={item.imageUrl} alt={item.id} width={32} height={40} className='w-8 h-10 mx-1' />
        <div className='flex flex-col flex-1'>
          <div className='flex items-center gap-1'>
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {isEditMode ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {isEditMode ? (
            <EditableField
              tag='span'
              path={item.editablePath}
              initialValue={item.description || ''}
              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
              onSave={item.onUpdateDescription}
            />
          ) : (
            item.description && (
              <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                {item.description}
              </span>
            )
          )}
        </div>
        {isEditMode && (
          <button
            type='button'
            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            aria-label={item.removeLabel}
            onClick={(e) => {
              e.stopPropagation();
              item.onRemove();
            }}
          >
            <TrashIcon className='w-4 h-4' aria-hidden='true' />
          </button>
        )}
      </div>
    );
  };

  const renderSpecialSkillItem = (item: SpecialSkillDisplayItem) => {
    const handleClick = () => {
      if (!isEditMode) {
        item.onNavigate();
      }
    };

    return (
      <div
        key={item.key}
        className={clsx(
          'flex flex-row items-center gap-3 p-2 rounded-lg',
          themeClasses.itemBg,
          !isEditMode && themeClasses.interactive,
          item.isMinor && 'opacity-60'
        )}
        role={!isEditMode ? 'button' : undefined}
        tabIndex={!isEditMode ? 0 : undefined}
        aria-label={item.ariaLabel}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (!isEditMode && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            item.onNavigate();
          }
        }}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.id}
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
            <span className='text-xs text-gray-700 dark:text-gray-300'>{item.id}</span>
            {isEditMode ? (
              <button
                type='button'
                onClick={item.onToggleMinor}
                className={themeClasses.toggle}
                aria-label={item.getToggleLabel(!!item.isMinor)}
              >
                {item.isMinor ? '次要' : '主要'}
              </button>
            ) : (
              item.isMinor && <span className={themeClasses.badge}>次要</span>
            )}
          </div>
          {isEditMode ? (
            <EditableField
              tag='span'
              path={item.editablePath}
              initialValue={item.description || ''}
              className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'
              onSave={item.onUpdateDescription}
            />
          ) : (
            item.description && (
              <span className='text-[11px] text-gray-500 dark:text-gray-400 mt-1 text-left'>
                {item.description}
              </span>
            )
          )}
        </div>
        {isEditMode && (
          <button
            type='button'
            className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            aria-label={item.removeLabel}
            onClick={(e) => {
              e.stopPropagation();
              item.onRemove();
            }}
          >
            <TrashIcon className='w-4 h-4' aria-hidden='true' />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className='flex items-center justify-between'>
        <span
          className={clsx('font-semibold text-sm flex items-center gap-1', themeClasses.headerText)}
        >
          <span
            className={clsx(
              'w-5 h-5 rounded-full flex items-center justify-center mr-1',
              themeClasses.iconBg
            )}
          >
            {icon}
          </span>
          {title}
        </span>
        {isEditMode && selectors}
      </div>
      <div className='grid grid-cols-1 gap-y-3 mt-2'>
        {!isEditMode && items.length === 0 ? (
          <span className='text-xs text-gray-400'>{emptyLabel}</span>
        ) : (
          items.map((item) => {
            if (item.type === 'character') {
              return renderCharacterItem(item);
            }
            if (item.type === 'knowledgeCard') {
              return renderKnowledgeCardItem(item);
            }
            return renderSpecialSkillItem(item);
          })
        )}
      </div>
    </div>
  );
};

function useRelationEditor(characterId: string, key: RelationCollectionKey) {
  const localCharacter = useSnapshot(characters[characterId]!) as unknown as RelationCollections;

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
        <PlusIcon className='w-4 h-4' aria-hidden='true' />
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
  const getImageUrl = React.useCallback(
    (targetId: string) =>
      AssetManager.getCharacterImageUrl(targetId, factionId === 'cat' ? 'mouse' : 'cat'),
    [factionId]
  );
  const char = getCharacterRelation(id);
  const { handleSelectCharacter } = useAppContext();
  const { navigate } = useNavigation();

  // Get hooks for managing relations
  const countersHook = useRelationEditor(id, 'counters');
  const counteredByHook = useRelationEditor(id, 'counteredBy');
  const counterEachOtherHook = useRelationEditor(id, 'counterEachOther');
  const collaboratorsHook = useRelationEditor(id, 'collaborators');

  const countersKnowledgeCardsHook = useRelationEditor(id, 'countersKnowledgeCards');
  const counteredByKnowledgeCardsHook = useRelationEditor(id, 'counteredByKnowledgeCards');
  const countersSpecialSkillsHook = useRelationEditor(id, 'countersSpecialSkills');
  const counteredBySpecialSkillsHook = useRelationEditor(id, 'counteredBySpecialSkills');

  const oppositeFactionId = factionId === 'cat' ? 'mouse' : 'cat';

  const sharedSelectorRelations = React.useMemo(
    () => [...char.counters, ...char.counteredBy, ...char.counterEachOther],
    [char.counters, char.counteredBy, char.counterEachOther]
  );

  const countersItems = React.useMemo(
    () =>
      sortByImportance([
        ...buildCharacterItems(
          'counters',
          char.counters,
          localCharacter.counters,
          countersHook,
          getImageUrl,
          handleSelectCharacter,
          {
            view: (targetId: string) => `选择角色 ${targetId}`,
            edit: (targetId: string) => `克制 ${targetId} 的关系`,
          },
          (targetId: string, isMinor: boolean) =>
            `切换${targetId}的克制关系为${isMinor ? '主要' : '次要'}`,
          (targetId: string) => `移除${targetId}的克制关系`
        ),
        ...buildKnowledgeCardItems(
          localCharacter.countersKnowledgeCards,
          'countersKnowledgeCards',
          countersKnowledgeCardsHook,
          (cardId) => navigate(`/cards/${encodeURIComponent(cardId)}`)
        ),
        ...buildSpecialSkillItems(
          localCharacter.countersSpecialSkills,
          'countersSpecialSkills',
          countersSpecialSkillsHook,
          (skillId) =>
            navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
          oppositeFactionId
        ),
      ]),
    [
      char.counters,
      countersHook,
      countersKnowledgeCardsHook,
      countersSpecialSkillsHook,
      getImageUrl,
      handleSelectCharacter,
      localCharacter.counters,
      localCharacter.countersKnowledgeCards,
      localCharacter.countersSpecialSkills,
      navigate,
      oppositeFactionId,
    ]
  );

  const counterEachOtherItems = React.useMemo(
    () =>
      sortByImportance(
        buildCharacterItems(
          'counterEachOther',
          char.counterEachOther,
          localCharacter.counterEachOther,
          counterEachOtherHook,
          getImageUrl,
          handleSelectCharacter,
          {
            view: (targetId: string) => `选择角色 ${targetId}`,
            edit: (targetId: string) => `与 ${targetId} 互有克制的关系`,
          },
          (targetId: string, isMinor: boolean) =>
            `切换${targetId}的互有克制关系为${isMinor ? '主要' : '次要'}`,
          (targetId: string) => `移除${targetId}的互有克制关系`
        )
      ),
    [
      char.counterEachOther,
      counterEachOtherHook,
      getImageUrl,
      handleSelectCharacter,
      localCharacter.counterEachOther,
    ]
  );

  const counteredByItems = React.useMemo(
    () =>
      sortByImportance([
        ...buildCharacterItems(
          'counteredBy',
          char.counteredBy,
          localCharacter.counteredBy,
          counteredByHook,
          getImageUrl,
          handleSelectCharacter,
          {
            view: (targetId: string) => `选择角色 ${targetId}`,
            edit: (targetId: string) => `被 ${targetId} 克制的关系`,
          },
          (targetId: string, isMinor: boolean) =>
            `切换${targetId}的被克制关系为${isMinor ? '主要' : '次要'}`,
          (targetId: string) => `移除${targetId}的被克制关系`
        ),
        ...buildKnowledgeCardItems(
          localCharacter.counteredByKnowledgeCards,
          'counteredByKnowledgeCards',
          counteredByKnowledgeCardsHook,
          (cardId) => navigate(`/cards/${encodeURIComponent(cardId)}`)
        ),
        ...buildSpecialSkillItems(
          localCharacter.counteredBySpecialSkills,
          'counteredBySpecialSkills',
          counteredBySpecialSkillsHook,
          (skillId) =>
            navigate(`/special-skills/${oppositeFactionId}/${encodeURIComponent(skillId)}`),
          oppositeFactionId
        ),
      ]),
    [
      char.counteredBy,
      counteredByHook,
      counteredByKnowledgeCardsHook,
      counteredBySpecialSkillsHook,
      getImageUrl,
      handleSelectCharacter,
      localCharacter.counteredBy,
      localCharacter.counteredByKnowledgeCards,
      localCharacter.counteredBySpecialSkills,
      navigate,
      oppositeFactionId,
    ]
  );

  const collaboratorItems = React.useMemo(
    () =>
      sortByImportance(
        buildCharacterItems(
          'collaborators',
          char.collaborators,
          localCharacter.collaborators,
          collaboratorsHook,
          (targetId: string) => AssetManager.getCharacterImageUrl(targetId, 'mouse'),
          handleSelectCharacter,
          {
            view: (targetId: string) => `选择角色 ${targetId}`,
            edit: (targetId: string) => `与 ${targetId} 的协作关系`,
          },
          (targetId: string, isMinor: boolean) =>
            `切换${targetId}的协作关系为${isMinor ? '主要' : '次要'}`,
          (targetId: string) => `移除${targetId}的协作关系`
        )
      ),
    [char.collaborators, collaboratorsHook, handleSelectCharacter, localCharacter.collaborators]
  );

  const sectionConfigs: RelationSectionConfig[] = [
    {
      key: 'counters',
      theme: 'blue',
      title: `被${id}克制的${factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
      icon: <HappyFaceIcon aria-hidden='true' />,
      items: countersItems,
      selectors: (
        <div className='flex gap-2'>
          <CharacterSelector
            currentCharacterId={id}
            factionId={factionId}
            relationType='counters'
            existingRelations={sharedSelectorRelations}
            onSelect={(characterId) => countersHook.handleAdd(characterId, '新增关系描述')}
          />
          <KnowledgeCardSelector
            selected={Array.from(localCharacter.countersKnowledgeCards ?? [])}
            onSelect={(cardName) =>
              countersKnowledgeCardsHook.handleAdd(cardName as string, '新增关系描述')
            }
            factionId={factionId == 'cat' ? 'mouse' : 'cat'}
          />
          <SpecialSkillSelector
            selected={Array.from(localCharacter.countersSpecialSkills ?? [])}
            factionId={factionId}
            onSelect={(skillName) =>
              countersSpecialSkillsHook.handleAdd(skillName as string, '新增关系描述')
            }
          />
        </div>
      ),
    },
    {
      key: 'counterEachOther',
      theme: 'amber',
      title: `与${id}互有克制的${factionId == 'cat' ? '老鼠' : '猫咪'}`,
      icon: <NeutralFaceIcon aria-hidden='true' />,
      items: counterEachOtherItems,
      selectors: (
        <div className='flex gap-2'>
          <CharacterSelector
            currentCharacterId={id}
            factionId={factionId}
            relationType='counterEachOther'
            existingRelations={sharedSelectorRelations}
            onSelect={(characterId) => counterEachOtherHook.handleAdd(characterId, '新增关系描述')}
          />
        </div>
      ),
      show: isEditMode || counterEachOtherItems.length > 0,
    },
    {
      key: 'counteredBy',
      theme: 'red',
      title: `克制${id}的${factionId == 'cat' ? '老鼠' : '猫咪'}/知识卡/特技`,
      icon: <SadFaceIcon aria-hidden='true' />,
      items: counteredByItems,
      selectors: (
        <div className='flex gap-2'>
          <CharacterSelector
            currentCharacterId={id}
            factionId={factionId}
            relationType='counteredBy'
            existingRelations={sharedSelectorRelations}
            onSelect={(characterId) => counteredByHook.handleAdd(characterId, '新增关系描述')}
          />
          <KnowledgeCardSelector
            selected={Array.from(localCharacter.counteredByKnowledgeCards ?? [])}
            onSelect={(cardName) =>
              counteredByKnowledgeCardsHook.handleAdd(cardName as string, '新增关系描述')
            }
            factionId={factionId == 'cat' ? 'mouse' : 'cat'}
          />
          <SpecialSkillSelector
            selected={Array.from(localCharacter.counteredBySpecialSkills ?? [])}
            factionId={factionId}
            onSelect={(skillName) =>
              counteredBySpecialSkillsHook.handleAdd(skillName as string, '新增关系描述')
            }
          />
        </div>
      ),
    },
    {
      key: 'collaborators',
      theme: 'green',
      title: `与${id}协作的老鼠`,
      icon: <HeartIcon aria-hidden='true' />,
      items: collaboratorItems,
      selectors:
        factionId === 'mouse' ? (
          <CharacterSelector
            currentCharacterId={id}
            factionId={factionId}
            relationType='collaborators'
            existingRelations={char.collaborators}
            onSelect={(characterId) => collaboratorsHook.handleAdd(characterId, '新增关系描述')}
          />
        ) : undefined,
      show: factionId === 'mouse',
    },
  ];

  const visibleSections = sectionConfigs.filter((section) => section.show !== false);

  return (
    <div className='flex gap-6 items-start bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg shadow'>
      <div className='flex flex-1 flex-col gap-4'>
        {visibleSections.map((section) => (
          <RelationSection
            key={section.key}
            title={section.title}
            icon={section.icon}
            theme={section.theme}
            items={section.items}
            selectors={section.selectors}
            isEditMode={isEditMode}
          />
        ))}
      </div>
    </div>
  );
};

export default CharacterRelationDisplay;
