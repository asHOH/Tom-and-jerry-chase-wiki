import React, { useCallback } from 'react';
import Tag from '../../../ui/Tag';
import { getPositioningTagColors, getPositioningTagContainerColor } from '@/lib/design-tokens';
import EditableField from '@/components/ui/EditableField';
import Tooltip from '@/components/ui/Tooltip';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';
import { setNestedProperty } from '@/lib/editUtils';
import { characters } from '@/data';
import { useAppContext } from '@/context/AppContext';
import { CharacterWithFaction } from '@/lib/types';
import { sortPositioningTags } from '@/constants/positioningTagSequences';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useDarkMode } from '@/context/DarkModeContext';

interface PositioningTagsSectionProps {
  tags: ReadonlyArray<{
    readonly tagName: string;
    readonly isMinor: boolean;
    readonly description: string;
    readonly additionalDescription?: string;
  }>;
  factionId: 'cat' | 'mouse';
}

function usePositioningTags({ factionId }: { factionId: 'cat' | 'mouse' }) {
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
  return { handleUpdate, handleAddPositioningTags, handleRemovePositioningTags, toggleIsMinor };
}

export default function PositioningTagsSection({ tags, factionId }: PositioningTagsSectionProps) {
  const { isEditMode } = useEditMode();
  const { isDetailedView: isDetailed } = useAppContext();

  const borderColor =
    factionId === 'cat'
      ? 'border-orange-200 dark:border-orange-700'
      : 'border-blue-200 dark:border-blue-700';
  const tagsKey = factionId === 'cat' ? 'catPositioningTags' : 'mousePositioningTags';

  const { handleUpdate, handleAddPositioningTags, handleRemovePositioningTags, toggleIsMinor } =
    usePositioningTags({ factionId });
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
              className={`rounded-lg p-3 ${getPositioningTagContainerColor(
                tag.tagName,
                tag.isMinor,
                factionId,
                isDarkMode
              )}`}
            >
              <div className='flex items-center gap-2 mb-2'>
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
                    <EditableField
                      tag='span'
                      path={`${tagsKey}.${originalIndex}.tagName`}
                      initialValue={tag.tagName}
                      onSave={(newValue) => handleUpdate(originalIndex, newValue, 'tagName')}
                    />
                  ) : (
                    <Tooltip
                      content={getPositioningTagTooltipContent(tag.tagName, factionId, isDetailed)}
                    >
                      {tag.tagName}
                    </Tooltip>
                  )}
                </Tag>
                {isEditMode ? (
                  <span
                    className='text-xs text-gray-500 dark:text-gray-400 cursor-pointer'
                    onClick={() => toggleIsMinor(originalIndex)}
                  >
                    {tag.isMinor ? '(次要)' : '(主要)'}
                  </span>
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
                  className={`text-sm text-gray-600 dark:text-gray-400 mt-2 pl-3 border-l-2 whitespace-pre-wrap ${borderColor}`}
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
          </div>
        )}
      </div>
    </div>
  );
}
