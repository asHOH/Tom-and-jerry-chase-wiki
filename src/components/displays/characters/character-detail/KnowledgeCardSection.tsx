'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from '@/components/Image';
import Tooltip from '@/components/ui/Tooltip';
import CharacterSection from './CharacterSection';
import type { KnowledgeCardGroup, KnowledgeCardGroupSet, FactionId, CardGroup } from '@/data/types';
import { useAppContext } from '../../../../context/AppContext';
import { catKnowledgeCards } from '@/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/data/mouseKnowledgeCards';
import { useEditMode } from '@/context/EditModeContext';
import KnowledgeCardPicker from '@/components/ui/KnowledgeCardPicker';
import EditableField from '@/components/ui/EditableField';
import { getCardRankColors } from '@/lib/design-tokens';
import GotoLink from '@/components/GotoLink';
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { characters } from '@/data';
import KnowledgeCardGroupSetDisplay from './KnowledgeCardGroupSetDisplay';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';
import Tag from '@/components/ui/Tag';
import {
  calculateKnowledgeCardCosts,
  isCardOptional,
  getKnowledgeCardCostStyles,
  flattenCardGroup,
  calculateMaxCostForTree,
  buildTreeStructure,
} from '@/lib/knowledgeCardSectionUtils';
import { Contributor, contributors } from '@/data/contributors';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import TreeCardDisplay from './TreeCardDisplay';

const cardGroupHasTreeStructure = (card: unknown): boolean => {
  if (typeof card === 'string') {
    return false;
  }

  if (!Array.isArray(card)) {
    return false;
  }

  return (card as readonly unknown[]).some((item, index) => {
    if (index === 0 && typeof item === 'boolean') {
      return true;
    }

    if (typeof item === 'boolean') {
      return false;
    }

    return cardGroupHasTreeStructure(item);
  });
};

const knowledgeGroupHasTreeStructure = (group: DeepReadonly<KnowledgeCardGroup>): boolean =>
  group.cards.some((card) => cardGroupHasTreeStructure(card));

const knowledgeGroupSetHasTreeStructure = (
  groupSet: DeepReadonly<KnowledgeCardGroupSet>
): boolean => groupSet.groups.some((group) => knowledgeGroupHasTreeStructure(group));

const isKnowledgeCardGroupSet = (
  group: DeepReadonly<KnowledgeCardGroup | KnowledgeCardGroupSet>
): group is DeepReadonly<KnowledgeCardGroupSet> => 'groups' in group;

interface KnowledgeCardSectionProps {
  knowledgeCardGroups: DeepReadonly<(KnowledgeCardGroup | KnowledgeCardGroupSet)[]>;
  factionId: FactionId;
  characterId: string;
  onCreateGroup: () => void;
  onRemoveGroup: (topIndex: number, innerIndex?: number) => void;
}

export type ViewMode = 'compact' | 'flat' | 'tree' | 'tree-folded';

/** Flat knowledge card group component - renders a simple string[] group */
function KnowledgeCardGroupFlat({
  cards,
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
  descriptionPath,
  contributor,
  contributorInformation,
  isDarkMode,
}: {
  cards: readonly string[];
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
  descriptionPath: string;
  contributor: string | undefined;
  contributorInformation: Contributor | undefined;
  isDarkMode: boolean;
}) {
  if (cards.length === 0 && !isEditMode) {
    return null;
  }

  const costInfo = calculateKnowledgeCardCosts(cards, getCardCost);
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
          {cards.map((cardId) => {
            const cardName = cardId.split('-')[1]!;
            const cardRank = getCardRank(cardId);
            const rankColors = getCardRankColors(cardRank, false, isDarkMode);
            const isOptional = isCardOptional(cardId, costInfo.hasOptionalCard, costInfo.totalCost);

            if (isSqueezedView) {
              return (
                <GotoLink key={cardId} name={cardName} className='no-underline' asPreviewOnly>
                  <span
                    onClick={() => {
                      if (isEditMode) return;
                      handleSelectCard(cardName, characterId);
                    }}
                    className='cursor-pointer'
                  >
                    <Tag
                      colorStyles={rankColors}
                      size='sm'
                      margin='compact'
                      className={clsx(
                        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm',
                        isOptional && 'opacity-50'
                      )}
                    >
                      {cardName}
                    </Tag>
                  </span>
                </GotoLink>
              );
            } else {
              return (
                <GotoLink
                  key={cardId}
                  name={cardName}
                  className='no-underline'
                  asPreviewOnly
                  hideImagePreview
                >
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
                </GotoLink>
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
              <TrashIcon className='w-4 h-4' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>

      {!!contributor && !isEditMode && (
        <div className={'ml-11 sm:ml-12 md:ml-13 lg:ml-14'}>
          <Tag
            colorStyles={
              isDarkMode
                ? { background: '#334155', color: '#e0e7ef' }
                : { background: '#e0e7ef', color: '#1e293b' }
            }
          >
            卡组推荐者：
            {(contributorInformation?.description !== undefined && (
              <Tooltip content={contributorInformation.description}>
                {contributorInformation.name}
              </Tooltip>
            )) ||
              contributor}
          </Tag>
        </div>
      )}

      {(!!description || isEditMode) && (
        <div
          className={clsx(
            'bg-gray-50 dark:bg-slate-700/50 p-2 sm:p-3 rounded-lg',
            'ml-11 sm:ml-12 md:ml-13 lg:ml-14'
          )}
        >
          <EditableField
            tag='div'
            path={descriptionPath}
            initialValue={description ?? ''}
            className='text-sm text-gray-700 dark:text-gray-300'
            enableEdit={isEditMode}
          />
        </div>
      )}
    </div>
  );
}

/** Wrapper component that handles both tree and flat rendering */
export function KnowledgeCardGroupDisplay({
  group,
  index,
  description,
  isEditMode,
  viewMode,
  handleSelectCard,
  characterId,
  handleEditClick,
  onRemoveGroup,
  getCardCost,
  getCardRank,
  imageBasePath,
  descriptionPath,
  contributor,
  contributorInformation,
  isDarkMode,
}: {
  group: readonly CardGroup[];
  index: number;
  description: string | undefined;
  isEditMode: boolean;
  viewMode: ViewMode;
  handleSelectCard: (cardName: string, characterId: string) => void;
  characterId: string;
  handleEditClick: (index: number) => void;
  onRemoveGroup: (index: number) => void;
  getCardCost: (cardId: string) => number;
  getCardRank: (cardId: string) => string;
  imageBasePath: string;
  descriptionPath: string;
  contributor: string | undefined;
  contributorInformation: Contributor | undefined;
  isDarkMode: boolean;
}) {
  const isSqueezedView = viewMode === 'compact';
  const isTreeView = viewMode === 'tree' || viewMode === 'tree-folded';
  const isFoldedMode = viewMode === 'tree-folded';

  if (isTreeView) {
    // Tree mode: show tree structure with max cost
    const maxCost = calculateMaxCostForTree(group, getCardCost);
    const treeStructure = buildTreeStructure(group);

    // For optional card handling in tree view
    const allFlatCombinations = flattenCardGroup(group);
    const hasAnyOptional = allFlatCombinations.some((combo) =>
      combo.some((cardId) => cardId === 'C-狡诈')
    );

    const { containerClass, tooltipContent } = getKnowledgeCardCostStyles(
      maxCost,
      hasAnyOptional,
      maxCost
    );

    return (
      <div className='flex flex-col space-y-2'>
        <div className='flex gap-0.5 sm:gap-1 md:gap-2 lg:gap-4 items-start'>
          <Tooltip content={tooltipContent} className='border-none'>
            <div
              className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold',
                containerClass
              )}
            >
              {maxCost}
            </div>
          </Tooltip>

          <div className='flex flex-1 min-w-0'>
            <TreeCardDisplay
              tree={treeStructure}
              isEditMode={isEditMode}
              isSqueezedView={isSqueezedView}
              handleSelectCard={handleSelectCard}
              characterId={characterId}
              getCardRank={getCardRank}
              imageBasePath={imageBasePath}
              isOptionalCard={(cardId) => cardId === 'C-狡诈' && hasAnyOptional}
              isFoldedMode={isFoldedMode}
              isDarkMode={isDarkMode}
            />
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
                <TrashIcon className='w-4 h-4' aria-hidden='true' />
              </button>
            </div>
          )}
        </div>

        {!!contributor && !isEditMode && (
          <div className={'ml-11 sm:ml-12 md:ml-13 lg:ml-14'}>
            <Tag
              colorStyles={
                isDarkMode
                  ? { background: '#334155', color: '#e0e7ef' }
                  : { background: '#e0e7ef', color: '#1e293b' }
              }
            >
              卡组推荐者：
              {(contributorInformation?.description !== undefined && (
                <Tooltip content={contributorInformation.description}>
                  {contributorInformation.name}
                </Tooltip>
              )) ||
                contributor}
            </Tag>
          </div>
        )}

        {(!!description || isEditMode) && (
          <div className='bg-gray-50 dark:bg-slate-700/50 p-2 sm:p-3 rounded-lg ml-11 sm:ml-12 md:ml-13 lg:ml-14'>
            <EditableField
              tag='div'
              path={descriptionPath}
              initialValue={description ?? ''}
              className='text-sm text-gray-700 dark:text-gray-300'
              enableEdit={isEditMode}
            />
          </div>
        )}
      </div>
    );
  } else {
    // Flat mode: flatten and render multiple groups
    const flattenedCombinations = flattenCardGroup(group);

    return (
      <>
        {flattenedCombinations.map((cards, subIndex) => (
          <React.Fragment key={subIndex}>
            <KnowledgeCardGroupFlat
              cards={cards}
              index={index}
              description={description}
              isEditMode={isEditMode}
              isSqueezedView={isSqueezedView}
              handleSelectCard={handleSelectCard}
              characterId={characterId}
              handleEditClick={handleEditClick}
              onRemoveGroup={onRemoveGroup}
              getCardCost={getCardCost}
              getCardRank={getCardRank}
              imageBasePath={imageBasePath}
              descriptionPath={descriptionPath}
              contributor={subIndex === 0 ? contributor : undefined}
              contributorInformation={subIndex === 0 ? contributorInformation : undefined}
              isDarkMode={isDarkMode}
            />
            {subIndex < flattenedCombinations.length - 1 && (
              <div className='border-t border-gray-300 dark:border-slate-600 my-2'></div>
            )}
          </React.Fragment>
        ))}
      </>
    );
  }
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
  const [isDarkMode] = useDarkMode();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<{
    topIndex: number;
    innerIndex?: number;
    isGroupSet: boolean;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('view-mode') ?? 'tree-folded') as ViewMode
  );
  const hasTreeStructure = useMemo(() => {
    return knowledgeCardGroups.some((group) => {
      if (isKnowledgeCardGroupSet(group)) {
        return knowledgeGroupSetHasTreeStructure(group);
      }
      return knowledgeGroupHasTreeStructure(group);
    });
  }, [knowledgeCardGroups]);

  useEffect(() => {
    localStorage.setItem('view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!hasTreeStructure && (viewMode === 'tree' || viewMode === 'tree-folded')) {
      setViewMode('flat');
    }
  }, [hasTreeStructure, viewMode]);

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

  const persistGroupCards = (
    topIndex: number,
    innerIndex: number | undefined,
    newCards: readonly string[]
  ) => {
    if (innerIndex === undefined) {
      (characters[characterId]!.knowledgeCardGroups[topIndex] as KnowledgeCardGroup).cards =
        Array.from(newCards) as CardGroup[];
      return;
    }
    const groupEntry = characters[characterId]!.knowledgeCardGroups[topIndex];
    if (groupEntry && 'groups' in groupEntry && Array.isArray(groupEntry.groups)) {
      groupEntry.groups[innerIndex]!.cards = Array.from(newCards) as CardGroup[];
    }
  };

  const updateGroupSetMetadata = (
    topIndex: number,
    field: 'id' | 'description' | 'detailedDescription' | 'defaultFolded',
    value: string | boolean | undefined
  ) => {
    const entry = characters[characterId]!.knowledgeCardGroups[topIndex];
    if (!entry || !('groups' in entry)) return;
    (entry as unknown as Record<string, string | boolean | undefined>)[field] = value;
  };

  const handleEditClick = (topIndex: number, innerIndex?: number) => {
    if (innerIndex === undefined) {
      setCurrentTarget({ topIndex, isGroupSet: false });
    } else {
      setCurrentTarget({ topIndex, innerIndex, isGroupSet: true });
    }
    setPickerOpen(true);
  };

  const handlePickerSave = (newCards: readonly string[]) => {
    const target = currentTarget;
    if (!target) return;

    persistGroupCards(target.topIndex, target.innerIndex, newCards);
    setPickerOpen(false);
    setCurrentTarget(null);
  };

  // Get initial selected cards - flatten for picker
  let initialSelectedCards: readonly string[] = [];
  if (currentTarget) {
    const top = knowledgeCardGroups[currentTarget.topIndex];
    if (!top) {
      initialSelectedCards = [];
    } else if (currentTarget.innerIndex === undefined && 'cards' in top) {
      // Flatten for editing
      const flattened = flattenCardGroup(top.cards);
      initialSelectedCards = flattened[0] || [];
    } else if (!('cards' in top) && 'groups' in top && currentTarget.innerIndex !== undefined) {
      const inner = top.groups[currentTarget.innerIndex];
      if (inner) {
        const flattened = flattenCardGroup(inner.cards);
        initialSelectedCards = flattened[0] || [];
      }
    }
  }

  const cycleViewMode = () => {
    const availableModes: ViewMode[] = hasTreeStructure
      ? ['tree', 'tree-folded', 'flat', 'compact']
      : ['flat', 'compact'];

    setViewMode((prev) => {
      if (availableModes.length === 0) {
        return prev;
      }

      const currentIndex = availableModes.indexOf(prev);
      if (currentIndex === -1) {
        return availableModes[0] as ViewMode;
      }

      const nextIndex = (currentIndex + 1) % availableModes.length;
      return availableModes[nextIndex] as ViewMode;
    });
  };

  const getViewModeLabel = () => {
    if (viewMode === 'tree') return '树状视图';
    if (viewMode === 'tree-folded') return '折叠树状视图';
    if (viewMode === 'flat') return hasTreeStructure ? '扁平视图' : '图片视图';
    return '紧凑视图';
  };

  if (!knowledgeCardGroups || knowledgeCardGroups.length === 0) {
    if (isEditMode) {
      return (
        <div>
          <CharacterSection title='推荐知识卡组'>
            <div className='card dark:bg-slate-800 dark:border-slate-700 p-4 space-y-3'>
              <div className='flex justify-between items-center mb-4'>
                <button
                  type='button'
                  onClick={cycleViewMode}
                  className='flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
                  aria-label={`当前: ${getViewModeLabel()}`}
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
                      d='M8.25 13.75L12 10L15.75 13.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  {getViewModeLabel()}
                </button>
                <button
                  type='button'
                  aria-label='添加知识卡组'
                  onClick={onCreateGroup}
                  className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
                >
                  <PlusIcon className='w-4 h-4' aria-hidden='true' />
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
          <div className='flex justify-between items-center mb-4'>
            <button
              type='button'
              onClick={cycleViewMode}
              className='flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
              aria-label={`当前: ${getViewModeLabel()}`}
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
                  d='M8.25 13.75L12 10L15.75 13.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              {getViewModeLabel()}
            </button>
            {isEditMode && (
              <button
                type='button'
                aria-label='添加知识卡组'
                onClick={onCreateGroup}
                className='w-8 h-8 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
              >
                <PlusIcon className='w-4 h-4' aria-hidden='true' />
              </button>
            )}
          </div>
          {knowledgeCardGroups.map((group, index) =>
            'cards' in group ? (
              <React.Fragment key={index}>
                <KnowledgeCardGroupDisplay
                  group={group.cards}
                  index={index}
                  description={group.description}
                  isEditMode={isEditMode}
                  viewMode={viewMode}
                  handleSelectCard={handleSelectCard}
                  characterId={characterId}
                  handleEditClick={handleEditClick}
                  onRemoveGroup={onRemoveGroup}
                  getCardCost={getCardCost}
                  getCardRank={getCardRank}
                  imageBasePath={imageBasePath}
                  descriptionPath={`knowledgeCardGroups.${index}.description`}
                  contributor={group.contributor}
                  contributorInformation={contributors.find(
                    (a) => a.id === group.contributor || a.name === group.contributor
                  )}
                  isDarkMode={isDarkMode}
                />
                {index < knowledgeCardGroups.length - 1 && (
                  <div className='border-t border-gray-200 dark:border-slate-700 my-4'></div>
                )}
              </React.Fragment>
            ) : (
              <React.Fragment key={index}>
                <KnowledgeCardGroupSetDisplay
                  groupSet={group}
                  topIndex={index}
                  isEditMode={isEditMode}
                  characterId={characterId}
                  viewMode={viewMode}
                  handleSelectCard={handleSelectCard}
                  handleEditClick={handleEditClick}
                  onRemoveInnerGroup={(top: number, inner: number) => onRemoveGroup(top, inner)}
                  onRemoveGroup={onRemoveGroup}
                  onEditGroupSetMetadata={updateGroupSetMetadata}
                  getCardCost={getCardCost}
                  getCardRank={getCardRank}
                  imageBasePath={imageBasePath}
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
