import React, { useCallback } from 'react';
import Tag from '../../../ui/Tag';
import { getPositioningTagColors, getPositioningTagContainerColor } from '@/lib/design-tokens';
import EditableField from '@/components/ui/EditableField';
import Tooltip from '@/components/ui/Tooltip';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';
import { setNestedProperty } from '@/lib/editUtils';
import { characters, PositioningTag } from '@/data';
import type { FactionId } from '@/data/types';
import { useAppContext } from '@/context/AppContext';
import { CharacterWithFaction } from '@/lib/types';
import { sortPositioningTags } from '@/constants/positioningTagSequences';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useDarkMode } from '@/context/DarkModeContext';
import { getWeaponSkillImageUrl } from '@/lib/weaponUtils';
import Image from '@/components/Image';
import clsx from 'clsx';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

// Helper function to get available tag names based on faction
function getAvailableTagNames(factionId: FactionId): string[] {
  if (factionId === 'cat') {
    return ['进攻', '防守', '追击', '打架', '速通', '翻盘', '后期'];
  } else {
    return ['奶酪', '干扰', '辅助', '救援', '破局', '砸墙', '后期'];
  }
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
      className='bg-transparent border-none outline-none text-inherit font-inherit cursor-pointer'
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
  const character = useSnapshot(characters[characterId]!);

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
      className='bg-transparent border-none outline-none text-inherit font-inherit cursor-pointer text-xs'
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
  const localCharacter = useSnapshot(characters[characterId]!);
  const key = factionId == 'cat' ? 'catPositioningTags' : 'mousePositioningTags';
  function getTags(char: DeepReadonly<CharacterWithFaction>) {
    return char.mousePositioningTags ?? char.catPositioningTags ?? [];
  }
  const updateTags = useCallback(
    (
      prevChar: DeepReadonly<CharacterWithFaction>,
      updatedTags: {
        tagName: string;
        isMinor: boolean;
        description: string;
        additionalDescription: string;
      }[]
    ) => {
      setNestedProperty(characters, `${localCharacter.id}.${key}`, updatedTags);
      return { ...prevChar, [key]: updatedTags };
    },
    [key, localCharacter.id]
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
  const handleAddPositioningTags = useCallback(() => {
    // Removed setLocalCharacter call due to missing function.
    const updatedTags = getTags(localCharacter).concat({
      tagName: factionId == 'mouse' ? '奶酪' : ('进攻' as const),
      isMinor: false,
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
  const toggleIsMinor = useCallback(
    (tagIndex: number) => {
      // Removed setLocalCharacter call due to missing function.
      const updatedTags = getTags(localCharacter).map((tag, index) =>
        index == tagIndex ? { ...tag, isMinor: !tag.isMinor } : tag
      );
      updateTags(localCharacter, updatedTags);
    },
    [localCharacter, updateTags]
  );
  return {
    handleUpdate,
    handleWeaponUpdate,
    handleAddPositioningTags,
    handleRemovePositioningTags,
    toggleIsMinor,
  };
}

export default function PositioningTagsSection({ tags, factionId }: PositioningTagsSectionProps) {
  const { isEditMode } = useEditMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { characterId } = useLocalCharacter();

  const borderColor =
    factionId === 'cat'
      ? 'border-orange-200 dark:border-orange-700'
      : 'border-blue-200 dark:border-blue-700';
  const tagsKey = factionId === 'cat' ? 'catPositioningTags' : 'mousePositioningTags';

  const {
    handleUpdate,
    handleWeaponUpdate,
    handleAddPositioningTags,
    handleRemovePositioningTags,
    toggleIsMinor,
  } = usePositioningTags({ factionId });
  const [isDarkMode] = useDarkMode();

  // Sort tags according to sequence (main tags first, then by sequence)
  const sortedTags = React.useMemo(() => {
    if (!tags || tags.length === 0) return [];
    return sortPositioningTags(tags, factionId);
  }, [tags, factionId]);

  if ((!tags || tags.length === 0) && !isEditMode) return null;

  return (
    <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
      <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3'>定位</h3>
      <div className='space-y-3'>
        {sortedTags.map((tag, index) => {
          // Find the original index in the unsorted array for edit operations
          const originalIndex = tags.findIndex(
            (t) =>
              t.tagName === tag.tagName &&
              t.isMinor === tag.isMinor &&
              t.description === tag.description
          );

          return (
            <div
              key={index}
              className={clsx(
                'rounded-lg p-3',
                getPositioningTagContainerColor(tag.tagName, tag.isMinor, factionId, isDarkMode)
              )}
            >
              <div className='flex items-center gap-2 mb-2'>
                <div className='relative'>
                  <Tag
                    colorStyles={getPositioningTagColors(
                      tag.tagName,
                      tag.isMinor,
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
                  {'weapon' in tag && !isEditMode && !!tag.weapon && (
                    <div className='absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center'>
                      {(() => {
                        const weaponImageUrl = getWeaponSkillImageUrl(
                          characterId,
                          tag.weapon,
                          factionId
                        );
                        return weaponImageUrl ? (
                          <Image
                            src={weaponImageUrl}
                            alt={`武器${tag.weapon}`}
                            width={14}
                            height={14}
                            className='rounded-sm'
                          />
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>
                {isEditMode ? (
                  <>
                    <button
                      type='button'
                      className='text-xs text-gray-500 dark:text-gray-400 cursor-pointer'
                      onClick={() => toggleIsMinor(originalIndex)}
                      aria-label={`切换为${tag.isMinor ? '主要' : '次要'}标签`}
                    >
                      {tag.isMinor ? '(次要)' : '(主要)'}
                    </button>
                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                      <WeaponDropdown
                        currentValue={tag.weapon}
                        characterId={characterId}
                        onSelect={(newWeapon) => handleWeaponUpdate(originalIndex, newWeapon)}
                      />
                    </div>
                  </>
                ) : (
                  tag.isMinor && (
                    <span className='text-xs text-gray-500 dark:text-gray-400'>(次要)</span>
                  )
                )}
                {isEditMode && (
                  <button
                    type='button'
                    aria-label='移除定位标签'
                    onClick={() => handleRemovePositioningTags(originalIndex)}
                    className='w-8 h-8 flex items-center justify-center ml-auto bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                  >
                    <TrashIcon className='w-4 h-4' aria-hidden='true' />
                  </button>
                )}
              </div>
              <EditableField
                tag='p'
                path={`${tagsKey}.${originalIndex}.description`}
                initialValue={tag.description}
                className='text-sm text-gray-700 dark:text-gray-300 mb-1 whitespace-pre-wrap'
                onSave={(newValue) => handleUpdate(originalIndex, newValue, 'description')}
              />
              {isDetailed && tag.additionalDescription && (
                <EditableField
                  tag='p'
                  path={`${tagsKey}.${originalIndex}.additionalDescription`}
                  initialValue={tag.additionalDescription}
                  className={clsx(
                    'text-sm text-gray-600 dark:text-gray-400 mt-2 pl-3 border-l-2 whitespace-pre-wrap',
                    borderColor
                  )}
                  onSave={(newValue) =>
                    handleUpdate(originalIndex, newValue, 'additionalDescription')
                  }
                />
              )}
            </div>
          );
        })}
        {isEditMode && (
          <div className='mt-4'>
            <button
              type='button'
              aria-label='添加定位标签'
              onClick={handleAddPositioningTags}
              className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
            >
              <PlusIcon className='w-4 h-4' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
