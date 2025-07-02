import React, { useCallback } from 'react';
import Tag from '../../../ui/Tag';
import { getPositioningTagColors, getPositioningTagContainerColor } from '@/lib/design-tokens';
import EditableField from '@/components/ui/EditableField';
import Tooltip from '@/components/ui/Tooltip';
import { getPositioningTagTooltipContent } from '@/lib/tooltipUtils';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { CharacterDetailsProps } from '@/lib/types';
import { saveFactionsAndCharacters, setNestedProperty } from '@/lib/editUtils';
import { characters } from '@/data';
import { useAppContext } from '@/context/AppContext';

interface PositioningTagsSectionProps {
  tags: Array<{
    tagName: string;
    isMinor: boolean;
    description: string;
    additionalDescription?: string;
  }>;
  factionId: 'cat' | 'mouse';
  characterId: string;
}

function usePositioningTags({ factionId }: { factionId: 'cat' | 'mouse' }) {
  const { localCharacter, setLocalCharacter } = useLocalCharacter();
  const key = factionId == 'cat' ? 'catPositioningTags' : 'mousePositioningTags';
  function getTags(char: CharacterDetailsProps['character']) {
    return char.mousePositioningTags ?? char.catPositioningTags ?? [];
  }
  const updateTags = useCallback(
    (
      prevChar: CharacterDetailsProps['character'],
      updatedTags: {
        tagName: string;
        isMinor: boolean;
        description: string;
        additionalDescription: string;
      }[]
    ) => {
      setNestedProperty(characters, `${localCharacter.id}.${key}`, updatedTags);
      saveFactionsAndCharacters();
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
      setLocalCharacter((prevChar) => {
        const updatedTags = getTags(prevChar).map((tag, index) =>
          index == tagIndex ? { ...tag, [propName]: newName } : tag
        );
        return updateTags(prevChar, updatedTags);
      });
    },
    [setLocalCharacter, updateTags]
  );
  const handleAddPositioningTags = useCallback(() => {
    setLocalCharacter((prevChar) => {
      const updatedTags = getTags(prevChar).concat({
        tagName: factionId == 'mouse' ? '奶酪' : ('进攻' as const),
        isMinor: false,
        description: '新增标签介绍',
        additionalDescription: '新增标签介绍',
      });
      return updateTags(prevChar, updatedTags);
    });
  }, [factionId, setLocalCharacter, updateTags]);
  const handleRemovePositioningTags = useCallback(
    (tagIndex: number) => {
      setLocalCharacter((prevChar) => {
        const updatedTags = getTags(prevChar).filter((_, index) => index != tagIndex);
        return updateTags(prevChar, updatedTags);
      });
    },
    [setLocalCharacter, updateTags]
  );
  const toggleIsMinor = useCallback(
    (tagIndex: number) => {
      setLocalCharacter((prevChar) => {
        const updatedTags = getTags(prevChar).map((tag, index) =>
          index == tagIndex ? { ...tag, isMinor: !tag.isMinor } : tag
        );
        return updateTags(prevChar, updatedTags);
      });
    },
    [setLocalCharacter, updateTags]
  );
  return { handleUpdate, handleAddPositioningTags, handleRemovePositioningTags, toggleIsMinor };
}

export default function PositioningTagsSection({
  tags,
  factionId,
  characterId,
}: PositioningTagsSectionProps) {
  const { isEditMode } = useEditMode();
  const { isDetailedView: isDetailed } = useAppContext();

  const borderColor = factionId === 'cat' ? 'border-orange-200' : 'border-blue-200';
  const tagsKey = factionId === 'cat' ? 'catPositioningTags' : 'mousePositioningTags';

  const { handleUpdate, handleAddPositioningTags, handleRemovePositioningTags, toggleIsMinor } =
    usePositioningTags({ factionId });

  if ((!tags || tags.length === 0) && !isEditMode) return null;

  return (
    <div className='mt-6 pt-4 border-t border-gray-200'>
      <h3 className='text-lg font-semibold text-gray-800 mb-3'>定位</h3>
      <div className='space-y-3'>
        {tags.map((tag, index) => (
          <div
            key={index}
            className={`rounded-lg p-3 ${getPositioningTagContainerColor(
              tag.tagName,
              tag.isMinor,
              factionId
            )}`}
          >
            <div className='flex items-center gap-2 mb-2'>
              <Tag
                colorStyles={getPositioningTagColors(tag.tagName, tag.isMinor, true, factionId)}
                size='sm'
              >
                {isEditMode ? (
                  <EditableField
                    tag='span'
                    path={`${characterId}.${tagsKey}.${index}.tagName`}
                    initialValue={tag.tagName}
                    onSave={(newValue) => handleUpdate(index, newValue, 'tagName')}
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
                  className='text-xs text-gray-500 cursor-pointer'
                  onClick={() => toggleIsMinor(index)}
                >
                  {tag.isMinor ? '(次要)' : '(主要)'}
                </span>
              ) : (
                tag.isMinor && <span className='text-xs text-gray-500'>(次要)</span>
              )}
              {isEditMode && (
                <button
                  type='button'
                  aria-label='移除定位标签'
                  onClick={() => handleRemovePositioningTags(index)}
                  className='w-8 h-8 flex items-center justify-center ml-auto bg-red-500 text-white rounded-md text-xs hover:bg-red-600'
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
              path={`${characterId}.${tagsKey}.${index}.description`}
              initialValue={tag.description}
              className='text-sm text-gray-700 mb-1 whitespace-pre-wrap'
              onSave={(newValue) => handleUpdate(index, newValue, 'description')}
            />
            {isDetailed && tag.additionalDescription && (
              <EditableField
                tag='p'
                path={`${characterId}.${tagsKey}.${index}.additionalDescription`}
                initialValue={tag.additionalDescription}
                className={`text-sm text-gray-600 mt-2 pl-3 border-l-2 whitespace-pre-wrap ${borderColor}`}
                onSave={(newValue) => handleUpdate(index, newValue, 'additionalDescription')}
              />
            )}
          </div>
        ))}
        {isEditMode && (
          <div className='mt-4'>
            <button
              type='button'
              aria-label='添加定位标签'
              onClick={handleAddPositioningTags}
              className='w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600'
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
