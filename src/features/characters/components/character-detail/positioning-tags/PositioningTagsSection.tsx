import React, { useCallback } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn, getPositioningTagColors, getPositioningTagContainerColor } from '@/lib/design';
import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { setNestedProperty } from '@/lib/editUtils';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { CharacterWithFaction } from '@/lib/types';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import {
  getPositioningTagLevel,
  getPositioningTagNames,
  isPositioningTagMinor,
  isPositioningTagVisible,
  sortPositioningTags,
} from '@/constants/positioningTagSequences';
import { characters as staticCharacters } from '@/data/static';
import type { FactionId, PositioningTag, PositioningTagLevel } from '@/data/types';
import { getWeaponSkillImageUrl } from '@/features/characters/utils/weapons';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

import { usePublishedCharacter } from '../PublishedCharacterContext';
import PositioningTagsChart from './PositioningTagsCharts';
import {
  getPositioningTagChartData,
  normalizePositioningTagViewMode,
  POSITIONING_TAG_VIEW_MODES,
  POSITIONING_TAG_VIEW_STORAGE_KEY,
  type PositioningTagViewMode,
} from './positioningTagViewModel';

const e = editable('characters');

// Helper function to get available tag names based on faction
function getAvailableTagNames(factionId: FactionId): readonly string[] {
  return getPositioningTagNames(factionId);
}

// Dropdown component for tag name selection
function TagNameDropdown({
  currentValue,
  factionId,
  onSelect,
}: {
  currentValue: string;
  factionId: FactionId;
  onSelect: (value: string) => void;
}) {
  const availableTags = getAvailableTagNames(factionId);

  return (
    <select
      value={currentValue}
      onChange={(e) => onSelect(e.target.value)}
      className='font-inherit cursor-pointer border-none bg-transparent text-inherit outline-none'
      aria-label='选择标签名称'
    >
      {availableTags.map((tagName) => (
        <option key={tagName} value={tagName}>
          {tagName}
        </option>
      ))}
    </select>
  );
}

function TagLevelDropdown({
  currentValue,
  onSelect,
}: {
  currentValue: PositioningTagLevel | undefined;
  onSelect: (value: PositioningTagLevel) => void;
}) {
  const levelLabels: Record<PositioningTagLevel, string> = {
    0: '0（无）',
    1: '1（仅编辑模式）',
    2: '2（次要）',
    3: '3（主要）',
    4: '4（主要）',
  };

  return (
    <select
      value={currentValue ?? 0}
      onChange={(event) => onSelect(Number(event.target.value) as PositioningTagLevel)}
      className='font-inherit cursor-pointer border-none bg-transparent text-xs text-inherit outline-none'
      aria-label='选择标签等级'
    >
      {([0, 1, 2, 3, 4] as const).map((level) => (
        <option key={level} value={level}>
          {levelLabels[level]}
        </option>
      ))}
    </select>
  );
}

// Dropdown component for weapon selection
function WeaponDropdown({
  currentValue,
  characterId,
  onSelect,
}: {
  currentValue: 1 | 2 | null | undefined;
  characterId: string;
  onSelect: (value: 1 | 2 | null) => void;
}) {
  const editRuntime = useActiveEditRuntime();
  const publishedCharacter = usePublishedCharacter(characterId);
  const character = useOptionalEditSnapshot(
    editRuntime?.stores.characters[characterId],
    publishedCharacter
  );
  if (!~character.skills?.findIndex((skill) => skill.type === 'weapon2') && currentValue == null)
    return;

  // Get weapon names from character skills
  const getWeaponName = (weaponNumber: 1 | 2): string => {
    if (!character?.skills) return `武器${weaponNumber}`;

    const weaponSkill = character.skills.find(
      (skill) => skill.type === (`weapon${weaponNumber}` as 'weapon1' | 'weapon2')
    );

    return weaponSkill?.name || `武器${weaponNumber}`;
  };

  const weapon1Name = getWeaponName(1);
  const weapon2Name = getWeaponName(2);

  return (
    <select
      value={currentValue || ''}
      onChange={(e) => {
        const value = e.target.value;
        if (value === '') {
          onSelect(null);
        } else {
          onSelect(parseInt(value) as 1 | 2);
        }
      }}
      className='font-inherit cursor-pointer border-none bg-transparent text-xs text-inherit outline-none'
      aria-label='选择武器'
    >
      <option value=''>无武器</option>
      <option value='1'>{weapon1Name}</option>
      <option value='2'>{weapon2Name}</option>
    </select>
  );
}

interface PositioningTagsSectionProps {
  tags: DeepReadonly<PositioningTag[]>;
  factionId: FactionId;
}

function usePositioningTags({ factionId }: { factionId: FactionId }) {
  const { characterId } = useLocalCharacter();
  const editRuntime = useActiveEditRuntime();
  const rawCharacter = editRuntime?.stores.characters[characterId];
  const publishedCharacter = usePublishedCharacter(characterId);
  const localCharacter = useOptionalEditSnapshot(rawCharacter, publishedCharacter);
  const key = factionId == 'cat' ? 'catPositioningTags' : 'mousePositioningTags';
  function getTags(char: DeepReadonly<CharacterWithFaction>) {
    return char.mousePositioningTags ?? char.catPositioningTags ?? [];
  }
  const updateTags = useCallback(
    (
      prevChar: DeepReadonly<CharacterWithFaction>,
      updatedTags: {
        tagName: string;
        level?: PositioningTagLevel;
        description: string;
        additionalDescription: string;
      }[]
    ) => {
      if (!editRuntime) return { ...prevChar, [key]: updatedTags };
      setNestedProperty(editRuntime.stores.characters, `${localCharacter.id}.${key}`, updatedTags);
      return { ...prevChar, [key]: updatedTags };
    },
    [editRuntime, key, localCharacter.id]
  );
  const handleUpdate = useCallback(
    (
      tagIndex: number,
      newName: string,
      propName: 'tagName' | 'description' | 'additionalDescription'
    ) => {
      // Removed setLocalCharacter call due to missing function.
      const updatedTags = getTags(localCharacter).map((tag, index) =>
        index == tagIndex ? { ...tag, [propName]: newName } : tag
      );
      updateTags(localCharacter, updatedTags);
    },
    [localCharacter, updateTags]
  );
  const handleWeaponUpdate = useCallback(
    (tagIndex: number, newWeapon: 1 | 2 | null) => {
      const updatedTags = getTags(localCharacter).map((tag, index) => {
        if (index == tagIndex) {
          const updatedTag = { ...tag };
          if (newWeapon === null) {
            delete updatedTag.weapon;
          } else {
            updatedTag.weapon = newWeapon;
          }
          return updatedTag;
        }
        return tag;
      });
      updateTags(localCharacter, updatedTags);
    },
    [localCharacter, updateTags]
  );
  const handleLevelUpdate = useCallback(
    (tagIndex: number, level: PositioningTagLevel) => {
      const updatedTags = getTags(localCharacter).map((tag, index) =>
        index === tagIndex ? { ...tag, level } : tag
      );
      updateTags(localCharacter, updatedTags);
    },
    [localCharacter, updateTags]
  );
  const handleAddPositioningTags = useCallback(() => {
    // Removed setLocalCharacter call due to missing function.
    const updatedTags = getTags(localCharacter).concat({
      tagName: factionId == 'mouse' ? '奶酪' : ('进攻' as const),
      level: 4,
      description: '新增标签介绍',
      additionalDescription: '新增标签介绍',
    });
    updateTags(localCharacter, updatedTags);
  }, [factionId, localCharacter, updateTags]);
  const handleRemovePositioningTags = useCallback(
    (tagIndex: number) => {
      // Removed setLocalCharacter call due to missing function.
      const updatedTags = getTags(localCharacter).filter((_, index) => index != tagIndex);
      updateTags(localCharacter, updatedTags);
    },
    [localCharacter, updateTags]
  );
  return {
    handleUpdate,
    handleWeaponUpdate,
    handleLevelUpdate,
    handleAddPositioningTags,
    handleRemovePositioningTags,
  };
}

export default function PositioningTagsSection({ tags, factionId }: PositioningTagsSectionProps) {
  const { isEditMode } = useEditMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { characterId } = useLocalCharacter();
  const editRuntime = useActiveEditRuntime();
  const charactersSnap = useOptionalEditSnapshot(editRuntime?.stores.characters, staticCharacters);

  const borderColor =
    factionId === 'cat'
      ? 'border-orange-200 dark:border-orange-700'
      : 'border-blue-200 dark:border-blue-700';
  const tagsKey = factionId === 'cat' ? 'catPositioningTags' : 'mousePositioningTags';

  const {
    handleUpdate,
    handleWeaponUpdate,
    handleLevelUpdate,
    handleAddPositioningTags,
    handleRemovePositioningTags,
  } = usePositioningTags({ factionId });
  const [isDarkMode] = useDarkMode();
  const [storedViewMode, setStoredViewMode] = useLocalStorage<string>(
    POSITIONING_TAG_VIEW_STORAGE_KEY,
    'text'
  );
  const savedViewMode = normalizePositioningTagViewMode(storedViewMode);
  const viewMode: PositioningTagViewMode = isEditMode ? 'text' : savedViewMode;

  React.useEffect(() => {
    if (storedViewMode !== savedViewMode) {
      setStoredViewMode(savedViewMode);
    }
  }, [savedViewMode, setStoredViewMode, storedViewMode]);

  const sortedTags = React.useMemo(() => {
    if (!tags || tags.length === 0) return [];
    return sortPositioningTags(
      tags.filter((tag) => isPositioningTagVisible(getPositioningTagLevel(tag), isEditMode)),
      factionId
    );
  }, [tags, factionId, isEditMode]);

  const chartData = React.useMemo(
    () => getPositioningTagChartData(sortedTags, factionId),
    [factionId, sortedTags]
  );

  const viewModeLabels: Record<PositioningTagViewMode, string> = {
    text: '文本',
    bar: '柱状图',
    rose: '玫瑰图',
  };

  if (sortedTags.length === 0 && !isEditMode) return null;

  return (
    <div className='mt-6 border-t border-gray-200 pt-4 dark:border-gray-700'>
      <div className='mb-3 flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>定位</h3>
        <div
          className='flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1 dark:bg-slate-800'
          role='group'
          aria-label='定位视图'
        >
          {POSITIONING_TAG_VIEW_MODES.map((mode) => {
            const isActive = viewMode === mode;
            const isDisabled = isEditMode && mode !== 'text';
            return (
              <button
                key={mode}
                type='button'
                aria-pressed={isActive}
                aria-label={`定位${viewModeLabels[mode]}视图`}
                disabled={isDisabled}
                onClick={() => setStoredViewMode(mode)}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
                  isActive
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-700/70 dark:hover:text-gray-200',
                  isDisabled &&
                    'cursor-not-allowed opacity-50 hover:bg-transparent dark:hover:bg-transparent'
                )}
              >
                {viewModeLabels[mode]}
              </button>
            );
          })}
        </div>
      </div>
      <div className='space-y-3'>
        {viewMode === 'text' ? (
          sortedTags.map((tag, index) => {
            // Find the original index in the unsorted array for edit operations
            const originalIndex = tags.findIndex(
              (t) =>
                t.tagName === tag.tagName &&
                getPositioningTagLevel(t) === getPositioningTagLevel(tag) &&
                t.description === tag.description
            );
            const hasWeapon = 'weapon' in tag && !!tag.weapon;

            return (
              <div
                key={index}
                className={cn(
                  'rounded-lg p-3',
                  getPositioningTagContainerColor(
                    tag.tagName,
                    getPositioningTagLevel(tag),
                    factionId
                  )
                )}
              >
                <div className='mb-2 flex items-center gap-2'>
                  <div className='relative'>
                    <Tag
                      colorStyles={getPositioningTagColors(
                        tag.tagName,
                        getPositioningTagLevel(tag),
                        true,
                        factionId,
                        isDarkMode
                      )}
                      size='sm'
                    >
                      {isEditMode ? (
                        <TagNameDropdown
                          currentValue={tag.tagName}
                          factionId={factionId}
                          onSelect={(newValue) => handleUpdate(originalIndex, newValue, 'tagName')}
                        />
                      ) : (
                        <Tooltip
                          content={getPositioningTagTooltipContent(
                            tag.tagName,
                            factionId,
                            isDetailed
                          )}
                        >
                          {tag.tagName}
                        </Tooltip>
                      )}
                    </Tag>
                    {hasWeapon && !isEditMode && (
                      <div className='border-border bg-surface-raised absolute top-1/2 -right-7 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border'>
                        {(() => {
                          const weaponImageUrl = getWeaponSkillImageUrl(
                            charactersSnap,
                            characterId,
                            tag.weapon,
                            factionId
                          );
                          return weaponImageUrl ? (
                            <Image
                              src={weaponImageUrl}
                              alt={`武器${tag.weapon}`}
                              width={18}
                              height={18}
                            />
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                  {isEditMode ? (
                    <>
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        <TagLevelDropdown
                          currentValue={getPositioningTagLevel(tag)}
                          onSelect={(level) => handleLevelUpdate(originalIndex, level)}
                        />
                      </div>
                      <div className='text-xs text-gray-500 dark:text-gray-400'>
                        <WeaponDropdown
                          currentValue={tag.weapon}
                          characterId={characterId}
                          onSelect={(newWeapon) => handleWeaponUpdate(originalIndex, newWeapon)}
                        />
                      </div>
                    </>
                  ) : (
                    isPositioningTagMinor(getPositioningTagLevel(tag)) && (
                      <span
                        className={cn(
                          'text-xs text-gray-500 dark:text-gray-400',
                          hasWeapon && 'pl-6'
                        )}
                      >
                        (次要)
                      </span>
                    )
                  )}
                  {isEditMode && (
                    <IconButton
                      type='button'
                      aria-label='移除定位标签'
                      onClick={() => handleRemovePositioningTags(originalIndex)}
                      variant='delete'
                      size='md'
                      className='ml-auto'
                    >
                      <TrashIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
                    </IconButton>
                  )}
                </div>
                <e.p
                  path={`${tagsKey}.${originalIndex}.description`}
                  initialValue={tag.description}
                  className='mb-1 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300'
                  onSave={(newValue) => handleUpdate(originalIndex, newValue, 'description')}
                />
                {isDetailed && tag.additionalDescription && (
                  <e.p
                    path={`${tagsKey}.${originalIndex}.additionalDescription`}
                    initialValue={tag.additionalDescription}
                    className={cn(
                      'mt-2 border-l-2 pl-3 text-sm whitespace-pre-wrap text-gray-600 dark:text-gray-400',
                      borderColor
                    )}
                    onSave={(newValue) =>
                      handleUpdate(originalIndex, newValue, 'additionalDescription')
                    }
                  />
                )}
              </div>
            );
          })
        ) : (
          <PositioningTagsChart
            data={chartData}
            factionId={factionId}
            isDetailed={isDetailed}
            isDarkMode={isDarkMode}
            viewMode={viewMode}
          />
        )}
        {isEditMode && (
          <div className='mt-4'>
            <IconButton
              type='button'
              aria-label='添加定位标签'
              onClick={handleAddPositioningTags}
              variant='add'
              size='md'
            >
              <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}
