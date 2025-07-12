import React from 'react';
import type { KnowledgeCardGroupSet } from '@/data/types';
import { KnowledgeCardGroup } from './KnowledgeCardSection';
import type { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext'; // Added import

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
  const { isEditMode } = useEditMode(); // Added useEditMode hook

  return (
    <div className='mb-6 rounded-lg p-4 bg-gray-50'>
      <h2 className='text-lg font-bold mb-2'>{groupSet.id}</h2>
      <div className='mb-2 text-gray-700'>
        {isDetailedView && groupSet.detailedDescription
          ? groupSet.detailedDescription
          : groupSet.description}
      </div>
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
            isEditMode={isEditMode}
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
  );
};

export default KnowledgeCardGroupSetDisplay;
