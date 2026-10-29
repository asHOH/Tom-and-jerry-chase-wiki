import React, { useCallback } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn, getPositioningTagColors, getPositioningTagContainerColor } from '@/lib/design';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { CharacterWithFaction } from '@/lib/types';
import { useEditableDomain, useEditableEntity } from '@/hooks/useEditableGameData';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import {
  getPositioningTagKey,
  getPositioningTagLevel,
  getPositioningTagNames,
  isPositioningTagMinor,
  isPositioningTagVisible,
  sortPositioningTags,
} from '@/constants/positioningTagSequences';
import { characters as staticCharacters } from '@/data/static';
import type { FactionId, PositioningTag, PositioningTagLevel } from '@/data/types';
import { getWeaponSkillImageUrl } from '@/features/characters/utils/weapons';
import { useLocalPreference } from '@/features/settings/localPreferences';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

import { usePublishedCharacter } from '../PublishedCharacterContext';
import PositioningTagsChart from './PositioningTagsCharts';
import { getPositioningTagChartData, type PositioningTagViewMode } from './positioningTagViewModel';

const e = editable('characters');

// Helper function to get available tag names based on faction
function getAvailableTagNames(factionId: FactionId): readonly string[] {
  return getPositioningTagNames(factionId);
}

// Dropdown component for tag name selection
function TagNameDropdown({
  currentValue,
  factionId,
  isUnavailable,
  onSelect,
}: {
  currentValue: string;
  factionId: FactionId;
  isUnavailable: (tagName: string) => boolean;
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
        <option key={tagName} value={tagName} disabled={isUnavailable(tagName)}>
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
  isUnavailable,
  onSelect,
}: {
  currentValue: 1 | 2 | null | undefined;
  characterId: string;
  isUnavailable: (weapon: 1 | 2 | undefined) => boolean;
  onSelect: (value: 1 | 2 | null) => void;
}) {
  const publishedCharacter = usePublishedCharacter(characterId);
  const [character] = useEditableEntity(
    { entityType: 'characters', entityId: characterId },
    publishedCharacter
  )!;
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
      <option value='' disabled={isUnavailable(undefined)}>
        无武器
      </option>
      <option value='1' disabled={isUnavailable(1)}>
        {weapon1Name}
      </option>
      <option value='2' disabled={isUnavailable(2)}>
        {weapon2Name}
      </option>
    </select>
  );
}

interface PositioningTagsSectionProps {
  tags: DeepReadonly<PositioningTag[]>;
  factionId: FactionId;
}

function usePositioningTags({ factionId }: { factionId: FactionId }) {
  const { characterId } = useLocalCharacter();
  const publishedCharacter = usePublishedCharacter(characterId);
  const [localCharacter, updateCharacter] = useEditableEntity(
    { entityType: 'characters', entityId: characterId },
    publishedCharacter
  )!;
  const key = factionId == 'cat' ? 'catPositioningTags' : 'mousePositioningTags';
  const tags = localCharacter[key];
  const isTagUsed = useCallback(
    (tagName: string, weapon: 1 | 2 | undefined, exceptIndex = -1) =>
      (tags ?? []).some(
        (tag, index) =>
          index !== exceptIndex &&
          getPositioningTagKey(tag) === getPositioningTagKey({ tagName, weapon })
      ),
    [tags]
  );
  const weaponScopes: (1 | 2 | undefined)[] = [undefined];
  if (localCharacter.skills?.some((skill) => skill.type === 'weapon1')) weaponScopes.push(1);
  if (localCharacter.skills?.some((skill) => skill.type === 'weapon2')) weaponScopes.push(2);
  const nextTag = weaponScopes
    .flatMap((weapon) => getPositioningTagNames(factionId).map((tagName) => ({ tagName, weapon })))
    .find((tag) => !isTagUsed(tag.tagName, tag.weapon));
  const updateTags = useCallback(
    (
      updatedTags: {
        tagName: string;
        level?: PositioningTagLevel;
        description: string;
        additionalDescription: string;
      }[]
    ) => {
      updateCharacter((draft) => {
        if (key === 'catPositioningTags') {
          draft.catPositioningTags = updatedTags as NonNullable<
            CharacterWithFaction['catPositioningTags']
          >;
        } else {
          draft.mousePositioningTags = updatedTags as NonNullable<
            CharacterWithFaction['mousePositioningTags']
          >;
        }
      });
    },
    [key, updateCharacter]
  );
  const handleUpdate = useCallback(
    (
      tagIndex: number,
      newName: string,
      propName: 'tagName' | 'description' | 'additionalDescription'
    ) => {
      if (propName === 'tagName' && isTagUsed(newName, tags?.[tagIndex]?.weapon, tagIndex)) return;
      const updatedTags = (tags ?? []).map((tag, index) =>
        index == tagIndex ? { ...tag, [propName]: newName } : tag
      );
      updateTags(updatedTags);
    },
    [tags, updateTags, isTagUsed]
  );
  const handleWeaponUpdate = useCallback(
    (tagIndex: number, newWeapon: 1 | 2 | null) => {
      const tag = tags?.[tagIndex];
      if (!tag || isTagUsed(tag.tagName, newWeapon ?? undefined, tagIndex)) return;
      const updatedTags = (tags ?? []).map((tag, index) => {
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
      updateTags(updatedTags);
    },
    [tags, updateTags, isTagUsed]
  );
  const handleLevelUpdate = useCallback(
    (tagIndex: number, level: PositioningTagLevel) => {
      const updatedTags = (tags ?? []).map((tag, index) =>
        index === tagIndex ? { ...tag, level } : tag
      );
      updateTags(updatedTags);
    },
    [tags, updateTags]
  );
  const handleAddPositioningTags = useCallback(() => {
    if (!nextTag) return;
    const updatedTags = (tags ?? []).concat({
      tagName: nextTag.tagName as PositioningTag['tagName'],
      ...(nextTag.weapon === undefined ? {} : { weapon: nextTag.weapon }),
      level: 4,
      description: '新增标签介绍',
      additionalDescription: '新增标签介绍',
    });
    updateTags(updatedTags);
  }, [nextTag, tags, updateTags]);
  const handleRemovePositioningTags = useCallback(
    (tagIndex: number) => {
      const updatedTags = (tags ?? []).filter((_, index) => index != tagIndex);
      updateTags(updatedTags);
    },
    [tags, updateTags]
  );
  return {
    isTagUsed,
    canAddPositioningTag: nextTag !== undefined,
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
  const [charactersSnap] = useEditableDomain('characters', staticCharacters);

  const borderColor =
    factionId === 'cat'
      ? 'border-orange-200 dark:border-orange-700'
      : 'border-blue-200 dark:border-blue-700';
  const tagsKey = factionId === 'cat' ? 'catPositioningTags' : 'mousePositioningTags';

  const {
    isTagUsed,
    canAddPositioningTag,
    handleUpdate,
    handleWeaponUpdate,
    handleLevelUpdate,
    handleAddPositioningTags,
    handleRemovePositioningTags,
  } = usePositioningTags({ factionId });
  const [storedViewMode] = useLocalPreference('positioningTagViewMode');
  const viewMode: PositioningTagViewMode = isEditMode ? 'text' : storedViewMode;

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

  if (sortedTags.length === 0 && !isEditMode) return null;

  return (
    <div className='border-border mt-6 border-t pt-4'>
      <div className='mb-3'>
        <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>定位</h3>
      </div>
      <div className='space-y-3'>
        {viewMode === 'text' ? (
          sortedTags.map((tag, index) => {
            // Find the original index in the unsorted array for edit operations
            const originalIndex = tags.indexOf(tag);
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
                        factionId
                      )}
                      size='sm'
                    >
                      {isEditMode ? (
                        <TagNameDropdown
                          currentValue={tag.tagName}
                          factionId={factionId}
                          isUnavailable={(tagName) => isTagUsed(tagName, tag.weapon, originalIndex)}
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
                          isUnavailable={(weapon) => isTagUsed(tag.tagName, weapon, originalIndex)}
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
                      'text-muted-foreground mt-2 border-l-2 pl-3 text-sm whitespace-pre-wrap',
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
            viewMode={viewMode}
          />
        )}
        {isEditMode && (
          <div className='mt-4'>
            <IconButton
              type='button'
              aria-label='添加定位标签'
              onClick={handleAddPositioningTags}
              disabled={!canAddPositioningTag}
              title={canAddPositioningTag ? '添加定位标签' : '所有武器范围的定位标签均已添加'}
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
