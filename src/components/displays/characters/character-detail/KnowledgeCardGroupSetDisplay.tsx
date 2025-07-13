import React, { useState } from 'react';
import type { KnowledgeCardGroupSet } from '@/data/types';
import { KnowledgeCardGroup } from './KnowledgeCardSection';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useAppContext } from '@/context/AppContext';

interface KnowledgeCardGroupSetDisplayProps {
  groupSet: DeepReadonly<KnowledgeCardGroupSet>;
  characterId: string;
  isSqueezedView: boolean;
  handleSelectCard: (cardName: string, characterId: string) => void;
  handleEditClick: (index: number) => void;
  onRemoveGroup: (index: number) => void;
  getCardCost: (cardId: string) => number;
  getCardRank: (cardId: string) => string;
  getCostStyles: (totalCost: number) => { containerClass: string; tooltipContent: string };
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
  getCostStyles,
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
      className={`transition-all ${isOpen ? 'duration-300 ease-out' : 'duration-200 ease-in'} ${isOpen ? 'mb-2' : 'mb-0'}`}
    >
      <button
        type='button'
        aria-label={isOpen ? `折叠${groupSet.id}` : `展开${groupSet.id}`}
        className='flex items-center justify-between w-full text-2xl font-bold py-3 mb-1 focus:outline-none cursor-pointer dark:text-white'
        onClick={toggleOpen}
      >
        <h3 className='pl-1 text-lg'>{groupSet.id}</h3>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ease-out ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
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
        className={`transition-all ease-out ${isOpen ? 'duration-300' : 'duration-200'} ${
          isOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
        {...(!isOpen && { 'aria-hidden': true })}
      >
        <div className='mb-6 rounded-lg p-4'>
          <div className='mb-2 text-gray-700'>
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
                  getCostStyles={getCostStyles}
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
