import React, { useState } from 'react';
import type { KnowledgeCardGroupSet } from '@/data/types';
import { KnowledgeCardGroupDisplay, type ViewMode } from './KnowledgeCardSection';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useAppContext } from '@/context/AppContext';
import clsx from 'clsx';
import { contributors } from '@/data/contributors';
import EditableField from '@/components/ui/EditableField';
import { TrashIcon } from '@/components/icons/CommonIcons';

interface KnowledgeCardGroupSetDisplayProps {
  groupSet: DeepReadonly<KnowledgeCardGroupSet>;
  topIndex: number;
  isEditMode: boolean;
  characterId: string;
  viewMode: ViewMode;
  handleSelectCard: (cardName: string, characterId: string) => void;
  handleEditClick: (topIndex: number, innerIndex?: number) => void;
  onRemoveInnerGroup: (topIndex: number, innerIndex: number) => void;
  onRemoveGroup: (index: number) => void;
  onEditGroupSetMetadata: (
    topIndex: number,
    field: 'id' | 'description' | 'detailedDescription' | 'defaultFolded',
    value: string | boolean | undefined
  ) => void;
  getCardCost: (cardId: string) => number;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
}

const KnowledgeCardGroupSetDisplay: React.FC<KnowledgeCardGroupSetDisplayProps> = ({
  groupSet,
  topIndex,
  isEditMode,
  characterId,
  viewMode,
  handleSelectCard,
  handleEditClick,
  onRemoveInnerGroup,
  onRemoveGroup,
  onEditGroupSetMetadata,
  getCardCost,
  getCardRank,
  imageBasePath,
}) => {
  'use no memo';
  const { isDetailedView } = useAppContext();
  const [isOpen, setIsOpen] = useState(!groupSet.defaultFolded || isEditMode);

  const toggleOpen = () => {
    setIsOpen(isEditMode ? true : !isOpen);
  };

  return (
    <div
      className={clsx(
        'transition-all',
        isOpen ? 'duration-300 ease-out' : 'duration-200 ease-in',
        isOpen ? 'mb-2' : 'mb-0'
      )}
    >
      <div className='flex items-center justify-between gap-2'>
        <button
          type='button'
          aria-label={isOpen ? `折叠${groupSet.id}` : `展开${groupSet.id}`}
          className={clsx(
            'flex-1 text-left text-2xl font-bold py-1 focus:outline-none dark:text-white',
            { 'cursor-pointer': !isEditMode }
          )}
          {...(isEditMode ? {} : { onClick: toggleOpen })}
        >
          <EditableField
            tag='h3'
            path={`knowledgeCardGroups.${topIndex}.id`}
            initialValue={groupSet.id}
            onSave={(v) => onEditGroupSetMetadata(topIndex, 'id', v)}
            className='pl-1 text-lg'
          />
        </button>

        {isEditMode && (
          <div className='flex gap-2'>
            <div className='flex items-center gap-1 text-xs'>
              <span className='text-xs text-gray-400 dark:text-gray-500'>显示方式:</span>
              <label className='flex items-center gap-1 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={groupSet.defaultFolded}
                  onChange={() => {
                    onEditGroupSetMetadata(topIndex, 'defaultFolded', !groupSet.defaultFolded);
                  }}
                  className='w-3 h-3'
                />
                <span className='font-bold'>
                  {groupSet.defaultFolded ? '默认折叠' : '默认展开'}
                </span>
              </label>
            </div>
            <button
              type='button'
              aria-label='移除知识卡组集合'
              onClick={() => onRemoveGroup(topIndex)}
              className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            >
              <TrashIcon className='w-4 h-4' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>

      <div
        className={clsx(
          'transition-all ease-out',
          isOpen ? 'duration-300' : 'duration-200',
          isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        )}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        {...(!isOpen && { 'aria-hidden': true })}
      >
        <div className='mb-6 rounded-lg p-4'>
          <EditableField
            tag='div'
            path={`knowledgeCardGroups.${topIndex}.${
              isDetailedView ? 'detailedDescription' : 'description'
            }`}
            initialValue={
              isDetailedView && groupSet.detailedDescription
                ? groupSet.detailedDescription
                : groupSet.description
            }
            onSave={(v) =>
              onEditGroupSetMetadata(
                topIndex,
                isDetailedView ? 'detailedDescription' : 'description',
                v
              )
            }
            className='mb-6 text-gray-700 dark:text-gray-300'
          />

          <div className='flex flex-col gap-y-4'>
            {groupSet.groups.map((group, index) => (
              <KnowledgeCardGroupDisplay
                key={index}
                group={group.cards}
                index={index}
                description={group.description}
                isEditMode={isEditMode}
                viewMode={viewMode}
                handleSelectCard={handleSelectCard}
                characterId={characterId}
                handleEditClick={() => handleEditClick(topIndex, index)}
                onRemoveGroup={() => onRemoveInnerGroup(topIndex, index)}
                getCardCost={getCardCost}
                getCardRank={getCardRank}
                imageBasePath={imageBasePath}
                descriptionPath={`knowledgeCardGroups.${topIndex}.groups.${index}.description`}
                contributor={group.contributor}
                contributorInformation={contributors.find(
                  (a) => a.id === group.contributor || a.name === group.contributor
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCardGroupSetDisplay;
