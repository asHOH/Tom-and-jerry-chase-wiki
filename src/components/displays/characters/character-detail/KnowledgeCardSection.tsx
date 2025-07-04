import React, { useState } from 'react';
import Image from 'next/image';
import Tooltip from '@/components/ui/Tooltip';
import CharacterSection from './CharacterSection';
import type { KnowledgeCardGroup } from '@/data/types';
import { useAppContext } from '../../../../context/AppContext';
import { catKnowledgeCards } from '@/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/data/mouseKnowledgeCards';
import { useEditMode } from '@/context/EditModeContext';
import KnowledgeCardPicker from '@/components/ui/KnowledgeCardPicker';
import EditableField from '@/components/ui/EditableField';

interface KnowledgeCardSectionProps {
  knowledgeCardGroups: KnowledgeCardGroup[];
  factionId: 'cat' | 'mouse';
  characterId: string;
  onSaveChanges: (updatedGroups: KnowledgeCardGroup[]) => void;
  onCreateGroup: () => void;
  onRemoveGroup: (index: number) => void;
}

export default function KnowledgeCardSection({
  knowledgeCardGroups,
  factionId,
  characterId,
  onSaveChanges,
  onCreateGroup,
  onRemoveGroup,
}: KnowledgeCardSectionProps) {
  const { handleSelectCard, handleTabChange } = useAppContext();
  const { isEditMode } = useEditMode();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number | null>(null);

  const imageBasePath = factionId === 'cat' ? '/images/catCards/' : '/images/mouseCards/';

  const getCardCost = (cardId: string) => {
    const cardName = cardId.split('-')[1];
    if (!cardName) return 0;

    const cardData =
      factionId === 'cat' ? catKnowledgeCards[cardName] : mouseKnowledgeCards[cardName];
    return cardData?.cost ?? 0;
  };

  const getCostStyles = (totalCost: number) => {
    if (totalCost >= 22) {
      return {
        containerClass: 'border-red-500 bg-red-100 text-red-700',
        tooltipContent: `知识量：${totalCost}点 (超出游戏限制)`,
      };
    } else if (totalCost === 21) {
      return {
        containerClass: 'border-amber-500 bg-amber-100 text-amber-700',
        tooltipContent: `知识量：${totalCost}点 (需开启+1知识量上限)`,
      };
    } else {
      return {
        containerClass: 'border-blue-400 bg-blue-50 text-blue-700',
        tooltipContent: `知识量：${totalCost}点`,
      };
    }
  };

  const handleEditClick = (index: number) => {
    setCurrentGroupIndex(index);
    setPickerOpen(true);
  };

  const handleDescriptionSave = (newDescription: string, index: number) => {
    const updatedGroups = [...knowledgeCardGroups];
    const currentGroup = updatedGroups[index];

    if (Array.isArray(currentGroup)) {
      // Convert to object form if it's just an array of cards
      updatedGroups[index] = {
        cards: currentGroup,
        description: newDescription,
      };
    } else if (currentGroup) {
      // Update description if it's already an object
      (currentGroup as { description: string }).description = newDescription;
    }

    onSaveChanges(updatedGroups);
  };

  const handlePickerSave = (newCards: string[]) => {
    if (currentGroupIndex === null) return;

    const updatedGroups = [...knowledgeCardGroups];
    const currentGroup = updatedGroups[currentGroupIndex];

    if (Array.isArray(currentGroup)) {
      updatedGroups[currentGroupIndex] = newCards;
    } else if (currentGroup) {
      (currentGroup as { cards: string[] }).cards = newCards;
    }

    onSaveChanges(updatedGroups);
    setPickerOpen(false);
  };

  const renderKnowledgeCardGroup = (group: string[], index: number, description?: string) => {
    if (group.length === 0 && !isEditMode) {
      return null;
    }

    const totalCost = group.reduce((sum, cardId) => sum + getCardCost(cardId), 0);
    const { containerClass, tooltipContent } = getCostStyles(totalCost);

    return (
      <div key={index} className='flex flex-col space-y-2'>
        <div className='flex items-start gap-0.5 sm:gap-1 md:gap-2 lg:gap-4'>
          <Tooltip content={tooltipContent} className='border-none'>
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${containerClass} flex items-center justify-center text-sm font-bold`}
            >
              {totalCost}
            </div>
          </Tooltip>
          <div className='flex flex-wrap gap-0 sm:gap-0.5 md:gap-1 lg:gap-2 flex-1 min-w-0'>
            {group.map((cardId) => (
              <Tooltip key={cardId} content={cardId.split('-')[1]!} className='border-none'>
                <div
                  className='relative w-20 h-20 sm:w-24 sm:h-24 cursor-pointer'
                  onClick={() => {
                    if (isEditMode) return;
                    handleTabChange(factionId === 'cat' ? 'catCards' : 'mouseCards');
                    handleSelectCard(cardId.split('-')[1]!, characterId);
                  }}
                >
                  <Image
                    src={`${imageBasePath}${cardId}.png`}
                    alt={cardId}
                    fill
                    className='object-contain'
                    unoptimized
                  />
                </div>
              </Tooltip>
            ))}
          </div>
          {isEditMode && (
            <div className='flex flex-col gap-2'>
              <button
                type='button'
                aria-label='编辑知识卡组'
                onClick={() => handleEditClick(index)}
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
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10'
                  />
                </svg>
              </button>
              <button
                type='button'
                aria-label='移除知识卡组'
                onClick={() => onRemoveGroup(index)}
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
        {(!!description || isEditMode) && (
          <div className='bg-gray-50 p-2 sm:p-3 rounded-lg ml-10 sm:ml-11 md:ml-12 lg:ml-14'>
            <EditableField
              tag='p'
              path={`${characterId}.knowledgeCardGroups[${index}].description`}
              initialValue={description || ''}
              onSave={(newDescription) => handleDescriptionSave(newDescription, index)}
              className='text-sm text-gray-700'
            />
          </div>
        )}
      </div>
    );
  };

  if (!knowledgeCardGroups || knowledgeCardGroups.length === 0) {
    if (isEditMode) {
      return (
        <div className='mb-8'>
          <CharacterSection title='推荐知识卡组'>
            <div className='card p-4 space-y-3'>
              <button
                type='button'
                aria-label='添加知识卡组'
                onClick={onCreateGroup}
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
          </CharacterSection>
        </div>
      );
    }
    return null;
  }

  const currentGroup =
    currentGroupIndex !== null ? knowledgeCardGroups[currentGroupIndex] : undefined;
  const initialSelectedCards = Array.isArray(currentGroup)
    ? currentGroup
    : (currentGroup?.cards ?? []);

  return (
    <div className='mb-8'>
      <CharacterSection title='推荐知识卡组'>
        <div className='card p-4 space-y-3'>
          {knowledgeCardGroups.map((group, index) => (
            <React.Fragment key={index}>
              {Array.isArray(group)
                ? renderKnowledgeCardGroup(group, index)
                : renderKnowledgeCardGroup(group.cards, index, group.description)}
              {index < knowledgeCardGroups.length - 1 && (
                <div className='border-t border-gray-200 my-4'></div>
              )}
            </React.Fragment>
          ))}
          {isEditMode && (
            <div className='mt-4'>
              <button
                type='button'
                aria-label='添加知识卡组'
                onClick={onCreateGroup}
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
      </CharacterSection>
      <KnowledgeCardPicker
        isOpen={isPickerOpen}
        onClose={() => setPickerOpen(false)}
        onSave={handlePickerSave}
        factionId={factionId}
        initialSelectedCards={initialSelectedCards}
      />
    </div>
  );
}
