import React, { useState } from 'react';
import type { KnowledgeCardGroupSet } from '@/data/types';
import { KnowledgeCardGroup } from './KnowledgeCardSection';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useAppContext } from '@/context/AppContext';
import clsx from 'clsx';

interface KnowledgeCardGroupSetDisplayProps {
  groupSet: DeepReadonly<KnowledgeCardGroupSet>;
  characterId: string;
  isSqueezedView: boolean;
  handleSelectCard: (cardName: string, characterId: string) => void;
  handleEditClick: (index: number) => void;
  onRemoveGroup: (index: number) => void;
  getCardCost: (cardId: string) => number;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
  handleDescriptionSave: (newDescription: string, index: number) => void;
}

const KnowledgeCardGroupSetDisplay: React.FC<KnowledgeCardGroupSetDisplayProps> = ({
  groupSet,
  characterId,
  isSqueezedView,
  handleSelectCard,
  handleEditClick,
  onRemoveGroup,
  getCardCost,
  getCardRank,
  imageBasePath,
  handleDescriptionSave,
}) => {
  const { isDetailedView } = useAppContext();
  const [isOpen, setIsOpen] = useState(!groupSet.defaultFolded);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={clsx(
        'transition-all',
        isOpen ? 'duration-300 ease-out' : 'duration-200 ease-in',
        isOpen ? 'mb-2' : 'mb-0'
      )}
    >
      <button
        type='button'
        aria-label={isOpen ? `折叠${groupSet.id}` : `展开${groupSet.id}`}
        className='flex items-center justify-between w-full text-2xl font-bold py-1 focus:outline-none cursor-pointer dark:text-white'
        onClick={toggleOpen}
      >
        <h3 className='pl-1 text-lg'>{groupSet.id}</h3>
        <svg
          className={clsx(
            'w-5.5 h-5.5 transform transition-transform duration-200 ease-out',
            isOpen ? 'rotate-0' : '-rotate-90'
          )}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M19 9l-7 7-7-7'
          ></path>
        </svg>
      </button>
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
          <div className='mb-6 text-gray-700 dark:text-gray-300'>
            {isDetailedView && groupSet.detailedDescription
              ? groupSet.detailedDescription
              : groupSet.description}
          </div>
          <div className='flex flex-col gap-y-4'>
            {groupSet.groups.map(
              (
                group,
                index // Added index to map
              ) => (
                <KnowledgeCardGroup
                  key={index} // Added key prop
                  group={group.cards}
                  index={index}
                  description={group.description}
                  isEditMode={false}
                  isSqueezedView={isSqueezedView}
                  handleSelectCard={handleSelectCard}
                  characterId={characterId}
                  handleEditClick={handleEditClick}
                  onRemoveGroup={onRemoveGroup}
                  getCardCost={getCardCost}
                  getCardRank={getCardRank}
                  imageBasePath={imageBasePath}
                  handleDescriptionSave={handleDescriptionSave}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCardGroupSetDisplay;
