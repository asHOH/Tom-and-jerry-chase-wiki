'use client';

import React, { useState } from 'react';
import Image from '@/components/Image';
import Tooltip from '@/components/ui/Tooltip';
import CharacterSection from './CharacterSection';
import type { KnowledgeCardGroup, KnowledgeCardGroupSet, FactionId } from '@/data/types';
import { useAppContext } from '../../../../context/AppContext';
import { catKnowledgeCards } from '@/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/data/mouseKnowledgeCards';
import { useEditMode } from '@/context/EditModeContext';
import KnowledgeCardPicker from '@/components/ui/KnowledgeCardPicker';
import EditableField from '@/components/ui/EditableField';
import { getCardRankColors } from '@/lib/design-tokens';
import KnowledgeCardTooltip from '@/components/ui/KnowledgeCardTooltip';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { characters } from '@/data';
import KnowledgeCardGroupSetDisplay from './KnowledgeCardGroupSetDisplay';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';
import {
  calculateKnowledgeCardCosts,
  isCardOptional,
  getKnowledgeCardCostStyles,
} from '@/lib/knowledgeCardSectionUtils';

interface KnowledgeCardSectionProps {
  knowledgeCardGroups: DeepReadonly<(KnowledgeCardGroup | KnowledgeCardGroupSet)[]>;
  factionId: FactionId;
  characterId: string;
  onCreateGroup: () => void;
  onRemoveGroup: (index: number) => void;
}
/** KnowledgeCardGroup component extracted from renderKnowledgeCardGroup */
export function KnowledgeCardGroup({
  group,
  index,
  description,
  isEditMode,
  isSqueezedView,
  handleSelectCard,
  characterId,
  handleEditClick,
  onRemoveGroup,
  getCardCost,
  getCardRank,
  imageBasePath,
  handleDescriptionSave,
}: {
  group: readonly string[];
  index: number;
  description: string | undefined;
  isEditMode: boolean;
  isSqueezedView: boolean;
  handleSelectCard: (cardName: string, characterId: string) => void;
  characterId: string;
  handleEditClick: (index: number) => void;
  onRemoveGroup: (index: number) => void;
  getCardCost: (cardId: string) => number;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
  handleDescriptionSave: (newDescription: string, index: number) => void;
}) {
  const [isDarkMode] = useDarkMode();
  if (group.length === 0 && !isEditMode) {
    return null;
  }

  // Calculate knowledge card costs and optional display logic
  const costInfo = calculateKnowledgeCardCosts(group, getCardCost);
  const { containerClass, tooltipContent } = getKnowledgeCardCostStyles(
    costInfo.displayCost,
    costInfo.hasOptionalCard,
    costInfo.totalCost
  );

  return (
    <div
      className={clsx(
        'flex flex-col transition-all duration-300 ease-in-out',
        isSqueezedView ? 'space-y-1' : 'space-y-2'
      )}
    >
      <div
        className={clsx(
          'flex gap-0.5 sm:gap-1 md:gap-2 lg:gap-4',
          isSqueezedView ? 'items-center' : 'items-start'
        )}
      >
        <Tooltip content={tooltipContent} className='border-none'>
          <div
            className={clsx(
              'flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold',
              containerClass
            )}
          >
            {costInfo.displayCost}
          </div>
        </Tooltip>
        <div
          className={clsx(
            'flex flex-1 min-w-0',
            isSqueezedView ? 'flex-wrap gap-1' : 'flex-wrap gap-0 sm:gap-0.5 md:gap-1 lg:gap-2'
          )}
        >
          {group.map((cardId) => {
            const cardName = cardId.split('-')[1]!;
            const cardRank = getCardRank(cardId);
            const rankColors = getCardRankColors(cardRank, false, isDarkMode);
            const isOptional = isCardOptional(cardId, costInfo.hasOptionalCard, costInfo.totalCost);

            if (isSqueezedView) {
              return (
                <KnowledgeCardTooltip
                  key={cardId}
                  cardName={cardName}
                  imageUrl={`${imageBasePath}${cardId}.png`}
                >
                  <span
                    className={clsx(
                      'px-2 py-1 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-sm',
                      isOptional && 'opacity-50'
                    )}
                    style={{
                      backgroundColor: rankColors.backgroundColor,
                      color: rankColors.color,
                    }}
                    onClick={() => {
                      if (isEditMode) return;
                      handleSelectCard(cardName, characterId);
                    }}
                  >
                    {cardName}
                  </span>
                </KnowledgeCardTooltip>
              );
            } else {
              return (
                <Tooltip key={cardId} content={cardName} className='border-none'>
                  <div
                    className={clsx(
                      'relative w-20 h-20 sm:w-24 sm:h-24 cursor-pointer transition-transform duration-200 hover:scale-105',
                      isOptional && 'opacity-50'
                    )}
                    onClick={() => {
                      if (isEditMode) return;
                      handleSelectCard(cardName, characterId);
                    }}
                  >
                    <Image
                      src={`${imageBasePath}${cardId}.png`}
                      alt={cardId}
                      fill
                      className='object-contain'
                    />
                  </div>
                </Tooltip>
              );
            }
          })}
        </div>
        {isEditMode && (
          <div className='flex flex-col gap-2'>
            <button
              type='button'
              aria-label='编辑知识卡组'
              onClick={() => handleEditClick(index)}
              className='w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-md text-xs hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
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
      {(!!description || isEditMode) && (
        <div
          className={clsx(
            'bg-gray-50 dark:bg-slate-700/50 p-2 sm:p-3 rounded-lg',
            isSqueezedView ? 'ml-11 sm:ml-12 md:ml-13 lg:ml-14' : 'ml-11 sm:ml-12 md:ml-13 lg:ml-14'
          )}
        >
          <EditableField
            tag='div'
            path={`knowledgeCardGroups.${index}.description`}
            initialValue={description ?? ''}
            onSave={(newDescription) => handleDescriptionSave(newDescription, index)}
            className='text-sm text-gray-700 dark:text-gray-300'
            enableEdit={isEditMode}
          />
        </div>
      )}
    </div>
  );
}

export default function KnowledgeCardSection({
  knowledgeCardGroups,
  factionId,
  characterId,
  onCreateGroup,
  onRemoveGroup,
}: KnowledgeCardSectionProps) {
  const { handleSelectCard } = useAppContext();
  const { isEditMode } = useEditMode();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number | null>(null);
  const [isSqueezedView, setIsSqueezedView] = useState(false);

  const imageBasePath = factionId === 'cat' ? '/images/catCards/' : '/images/mouseCards/';

  const getCardCost = (cardId: string) => {
    const cardName = cardId.split('-')[1];
    if (!cardName) return 0;

    const cardData =
      factionId === 'cat' ? catKnowledgeCards[cardName] : mouseKnowledgeCards[cardName];
    return cardData?.cost ?? 0;
  };

  const getCardRank = (cardId: string) => {
    const cardName = cardId.split('-')[1];
    if (!cardName) return 'C';

    const cardData =
      factionId === 'cat' ? catKnowledgeCards[cardName] : mouseKnowledgeCards[cardName];
    return cardData?.rank ?? 'C';
  };

  const handleEditClick = (index: number) => {
    setCurrentGroupIndex(index);
    setPickerOpen(true);
  };

  const handleDescriptionSave = (newDescription: string, index: number) => {
    const updatedGroups = [...knowledgeCardGroups];
    const currentGroup = updatedGroups[index];

    if (currentGroup) {
      // Update description - all groups are now objects
      characters[characterId]!.knowledgeCardGroups[index]!.description = newDescription;
    }
  };

  const handlePickerSave = (newCards: readonly string[]) => {
    if (currentGroupIndex === null) return;

    const updatedGroups = [...knowledgeCardGroups];
    const currentGroup = updatedGroups[currentGroupIndex];

    if (currentGroup) {
      // Update cards - all groups are now objects
      (
        characters[characterId]!.knowledgeCardGroups[currentGroupIndex] as KnowledgeCardGroup
      ).cards = Array.from(newCards);
    }

    setPickerOpen(false);
  };

  const currentGroup =
    currentGroupIndex !== null ? knowledgeCardGroups[currentGroupIndex] : undefined;
  const initialSelectedCards = (currentGroup as KnowledgeCardGroup)?.cards ?? [];

  if (!knowledgeCardGroups || knowledgeCardGroups.length === 0) {
    if (isEditMode) {
      return (
        <div>
          <CharacterSection title='推荐知识卡组'>
            <div className='card dark:bg-slate-800 dark:border-slate-700 p-4 space-y-3'>
              <div className='flex justify-between items-center mb-4'>
                <button
                  type='button'
                  onClick={() => setIsSqueezedView(!isSqueezedView)}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                    isSqueezedView
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                  )}
                  aria-label={isSqueezedView ? '切换到普通视图' : '切换到紧凑视图'}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth='2'
                    stroke='currentColor'
                    className={clsx(
                      'w-4 h-4 transition-transform duration-200',
                      isSqueezedView ? 'rotate-90' : 'rotate-180'
                    )}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M8.25 13.75L12 10L15.75 13.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  {isSqueezedView ? '紧凑视图' : '普通视图'}
                </button>
                <button
                  type='button'
                  aria-label='添加知识卡组'
                  onClick={onCreateGroup}
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
            </div>
          </CharacterSection>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <CharacterSection title='推荐知识卡组'>
        <div className='card dark:bg-slate-800 dark:border-slate-700 p-4 space-y-3'>
          {/* Toggle button for squeezed view */}
          <div className='flex justify-between items-center mb-4'>
            <button
              type='button'
              onClick={() => setIsSqueezedView(!isSqueezedView)}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                isSqueezedView
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
              )}
              aria-label={isSqueezedView ? '切换到普通视图' : '切换到紧凑视图'}
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
                className={clsx(
                  'w-4 h-4 transition-transform duration-200',
                  isSqueezedView ? 'rotate-90' : 'rotate-180'
                )}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M8.25 13.75L12 10L15.75 13.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              {isSqueezedView ? '紧凑视图' : '普通视图'}
            </button>
            {isEditMode && (
              <button
                type='button'
                aria-label='添加知识卡组'
                onClick={onCreateGroup}
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
            )}
          </div>

          {knowledgeCardGroups.map((group, index) =>
            'cards' in group ? (
              <React.Fragment key={index}>
                <KnowledgeCardGroup
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
                  imageBasePath={imageBasePath}
                  handleDescriptionSave={handleDescriptionSave}
                />
                {index < knowledgeCardGroups.length - 1 && (
                  <div className='border-t border-gray-200 dark:border-slate-700 my-4'></div>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment key={index}>
                <KnowledgeCardGroupSetDisplay
                  groupSet={group}
                  characterId={characterId}
                  isSqueezedView={isSqueezedView}
                  handleSelectCard={handleSelectCard}
                  handleEditClick={handleEditClick}
                  onRemoveGroup={onRemoveGroup}
                  getCardCost={getCardCost}
                  getCardRank={getCardRank}
                  imageBasePath={imageBasePath}
                  handleDescriptionSave={handleDescriptionSave}
                />
                {index < knowledgeCardGroups.length - 1 && (
                  <div className='border-t border-gray-200 dark:border-slate-700 my-4'></div>
                )}
              </React.Fragment>
            )
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
