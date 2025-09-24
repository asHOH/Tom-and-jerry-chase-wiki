import React, { useState } from 'react';
import type { KnowledgeCardGroupSet } from '@/data/types';
import { KnowledgeCardGroup } from './KnowledgeCardSection';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useAppContext } from '@/context/AppContext';
import clsx from 'clsx';
import { contributors } from '@/data/contributors';
import EditableField from '@/components/ui/EditableField';

interface KnowledgeCardGroupSetDisplayProps {
  groupSet: DeepReadonly<KnowledgeCardGroupSet>;
  topIndex: number;
  isEditMode: boolean;
  characterId: string;
  isSqueezedView: boolean;
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
  isSqueezedView,
  handleSelectCard,
  handleEditClick,
  onRemoveInnerGroup,
  onRemoveGroup,
  onEditGroupSetMetadata,
  getCardCost,
  getCardRank,
  imageBasePath,
}) => {
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
              <KnowledgeCardGroup
                key={index}
                group={group.cards}
                index={index}
                description={group.description}
                isEditMode={isEditMode}
                isSqueezedView={isSqueezedView}
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
