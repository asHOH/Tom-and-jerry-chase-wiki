'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { characters } from '@/data';
import { catKnowledgeCards } from '@/data/catKnowledgeCards';
import { Contributor, contributors } from '@/data/contributors';
import { mouseKnowledgeCards } from '@/data/mouseKnowledgeCards';
import type { CardGroup, FactionId, KnowledgeCardGroup, KnowledgeCardGroupSet } from '@/data/types';
import clsx from 'clsx';

import type { DeepReadonly } from '@/types/deep-readonly';
import { getCardRankColors } from '@/lib/design-tokens';
import {
  buildTreeStructure,
  calculateKnowledgeCardCosts,
  calculateMaxCostForTree,
  flattenCardGroup,
  getKnowledgeCardCostStyles,
  isCardOptional,
} from '@/lib/knowledgeCardSectionUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import EditableField from '@/components/ui/EditableField';
import KnowledgeCardPicker from '@/components/ui/KnowledgeCardPicker';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import GotoLink from '@/components/GotoLink';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

import { useAppContext } from '../../../../context/AppContext';
import CharacterSection from './CharacterSection';
import KnowledgeCardGroupSetDisplay from './KnowledgeCardGroupSetDisplay';
import TreeCardDisplay from './TreeCardDisplay';

const cardGroupHasTreeStructure = (card: unknown): boolean => {
  if (typeof card === 'string') {
    return false;
  }

  if (!Array.isArray(card)) {
    return false;
  }

  return (card as readonly unknown[]).some((item, index) => {
    if (index === 0 && typeof item === 'number') {
      return true;
    }

    if (typeof item === 'number') {
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

const getWarningTagStyles = (isDarkMode: boolean) =>
  isDarkMode
    ? { background: '#dc2626', color: '#fef2f2' }
    : { background: '#fef2f2', color: '#dc2626' };

const getPriorityTagStyles = (isDarkMode: boolean) =>
  isDarkMode
    ? { background: '#92400e', color: '#fff7ed' }
    : { background: '#fef3c7', color: '#92400e' };

interface WarningMessagesInput {
  warnTieXue: boolean;
  warnJiuJiuWo: boolean;
  warnRescue: boolean;
  highPriorityCardNames: string[];
  isEditMode: boolean;
}

const buildWarningMessages = ({
  warnTieXue,
  warnJiuJiuWo,
  warnRescue,
  highPriorityCardNames,
  isEditMode,
}: WarningMessagesInput) => {
  const missingWarnings: string[] = [];
  if (warnTieXue) missingWarnings.push('无铁血');
  if (warnJiuJiuWo) missingWarnings.push('无救救我');
  if (warnRescue) missingWarnings.push('无救援卡');

  const missingWarningMessage = missingWarnings.length
    ? `该卡组${missingWarnings.join('、')}，慎用`
    : null;
  const priorityWarning =
    highPriorityCardNames.length > 0 && !isEditMode
      ? `${highPriorityCardNames.join('、')}建议3级佩戴`
      : null;

  return { missingWarningMessage, priorityWarning };
};

interface GroupMetaRowProps {
  contributor: string | undefined;
  contributorInformation: Contributor | undefined;
  isEditMode: boolean;
  isDarkMode: boolean;
  missingWarningMessage: string | null;
  priorityWarning: string | null;
}

const GroupMetaRow = ({
  contributor,
  contributorInformation,
  isEditMode,
  isDarkMode,
  missingWarningMessage,
  priorityWarning,
}: GroupMetaRowProps) => {
  const shouldShowContributor = !!contributor && !isEditMode;
  if (!shouldShowContributor && !missingWarningMessage && !priorityWarning) {
    return null;
  }

  const warningTagStyles = getWarningTagStyles(isDarkMode);
  const priorityTagStyles = getPriorityTagStyles(isDarkMode);

  return (
    <div className='ml-11 flex flex-wrap items-center gap-1 sm:ml-12 md:ml-13 lg:ml-14'>
      {shouldShowContributor && (
        <Tag
          size='xs'
          margin='micro'
          className='opacity-80'
          colorStyles={
            isDarkMode
              ? { background: '#334155', color: '#e0e7ef' }
              : { background: '#e0e7ef', color: '#1e293b' }
          }
        >
          推荐人：
          {(contributorInformation?.description !== undefined && (
            <Tooltip content={contributorInformation.description}>
              {contributorInformation.name}
            </Tooltip>
          )) ||
            contributor}
        </Tag>
      )}
      {missingWarningMessage && (
        <Tag
          size='xs'
          margin='micro'
          className='items-center gap-1 opacity-80'
          colorStyles={warningTagStyles}
        >
          {missingWarningMessage}
        </Tag>
      )}
      {priorityWarning && (
        <Tag
          size='xs'
          margin='micro'
          className='items-center gap-1 opacity-80'
          colorStyles={priorityTagStyles}
        >
          {priorityWarning}
        </Tag>
      )}
    </div>
  );
};

interface GroupDescriptionBlockProps {
  description: string | undefined;
  isEditMode: boolean;
  descriptionPath: string;
}

const GroupDescriptionBlock = ({
  description,
  isEditMode,
  descriptionPath,
}: GroupDescriptionBlockProps) => {
  if (!description && !isEditMode) {
    return null;
  }

  return (
    <div
      className={clsx(
        'rounded-lg bg-gray-50 p-2 sm:p-3 dark:bg-slate-700/50',
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
  );
};

interface KnowledgeCardSectionProps {
  knowledgeCardGroups: DeepReadonly<(KnowledgeCardGroup | KnowledgeCardGroupSet)[]>;
  factionId: FactionId;
  characterId: string;
  onCreateGroup: () => void;
  onRemoveGroup: (topIndex: number, innerIndex?: number) => void;
}

export type ViewMode = 'compact' | 'tree' | 'hybrid';

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
  getCardPriority,
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
  getCardPriority: (cardId: string) => string | undefined;
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
  const isMouseFaction = characters[characterId]?.factionId === 'mouse';
  const hasJiuJiuWo = cards.includes('C-救救我');
  const hasRescueSkill = cards.includes('S-舍己') || cards.includes('S-无畏');
  const hasTieXue = cards.includes('S-铁血');
  const shouldWarnMissingRescueSkill = !isEditMode && isMouseFaction && !hasRescueSkill;
  const shouldWarnMissingJiuJiuWo = !isEditMode && isMouseFaction && !hasJiuJiuWo;
  const shouldWarnMissingTieXue = !isEditMode && isMouseFaction && !hasTieXue;

  const highPriorityCards = cards.filter((cardId) => {
    const priority = getCardPriority(cardId);
    return priority === '3级质变';
  });
  const highPriorityCardNames = highPriorityCards
    .map((id) => id.split('-')[1])
    .filter((name): name is string => Boolean(name));
  const { missingWarningMessage, priorityWarning } = buildWarningMessages({
    warnTieXue: shouldWarnMissingTieXue,
    warnJiuJiuWo: shouldWarnMissingJiuJiuWo,
    warnRescue: shouldWarnMissingRescueSkill,
    highPriorityCardNames,
    isEditMode,
  });

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
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
              containerClass
            )}
          >
            {costInfo.displayCost}
          </div>
        </Tooltip>

        <div
          className={clsx(
            'flex min-w-0 flex-1',
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
                      'relative h-20 w-20 cursor-pointer transition-transform duration-200 hover:scale-105 sm:h-24 sm:w-24',
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
              className='flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-xs text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
                className='h-4 w-4'
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
              className='flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            >
              <TrashIcon className='h-4 w-4' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>

      <GroupMetaRow
        contributor={contributor}
        contributorInformation={contributorInformation}
        isEditMode={isEditMode}
        isDarkMode={isDarkMode}
        missingWarningMessage={missingWarningMessage}
        priorityWarning={priorityWarning}
      />

      <GroupDescriptionBlock
        description={description}
        isEditMode={isEditMode}
        descriptionPath={descriptionPath}
      />
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
  getCardPriority,
}: {
  group: DeepReadonly<CardGroup[]>;
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
  getCardPriority: (cardId: string) => string | undefined;
}) {
  const normalizedGroup = group as unknown as readonly CardGroup[];
  const isSqueezedView = viewMode === 'compact';
  const isTreeView =
    viewMode === 'tree' ||
    viewMode === 'compact' ||
    // viewMode === 'tree-folded' ||
    viewMode === 'hybrid';
  // const isFoldedMode = viewMode === 'tree-folded';
  const isHybridMode = viewMode === 'hybrid';

  const isMobile = useMobile();
  const isMouseFaction = characters[characterId]?.factionId === 'mouse';

  if (isTreeView) {
    // Tree mode: show tree structure with max cost
    const maxCost = calculateMaxCostForTree(normalizedGroup, getCardCost);
    const treeStructure = buildTreeStructure(normalizedGroup);

    // For optional card handling in tree view
    const allFlatCombinations = flattenCardGroup(normalizedGroup);
    const hasAnyOptional = allFlatCombinations.some((combo) =>
      combo.some((cardId) => cardId === 'C-狡诈')
    );
    const lacksRescueSkill = allFlatCombinations.some(
      (combo) => !combo.includes('S-舍己') && !combo.includes('S-无畏')
    );
    const lacksJiuJiuWo = allFlatCombinations.some((combo) => !combo.includes('C-救救我'));
    const lacksTieXue = allFlatCombinations.some((combo) => !combo.includes('S-铁血'));
    const shouldWarnMissingRescueSkill = !isEditMode && isMouseFaction && lacksRescueSkill;
    const shouldWarnMissingJiuJiuWo = !isEditMode && isMouseFaction && lacksJiuJiuWo;
    const shouldWarnMissingTieXue = !isEditMode && isMouseFaction && lacksTieXue;

    const uniqueCards = Array.from(new Set(allFlatCombinations.flat()));
    const highPriorityCards = uniqueCards.filter((cardId) => {
      const priority = getCardPriority(cardId);
      return priority === '3级质变';
    });
    const highPriorityCardNames = highPriorityCards
      .map((id) => id.split('-')[1])
      .filter((name): name is string => Boolean(name));

    const { missingWarningMessage, priorityWarning } = buildWarningMessages({
      warnTieXue: shouldWarnMissingTieXue,
      warnJiuJiuWo: shouldWarnMissingJiuJiuWo,
      warnRescue: shouldWarnMissingRescueSkill,
      highPriorityCardNames,
      isEditMode,
    });

    const { containerClass, tooltipContent } = getKnowledgeCardCostStyles(
      maxCost,
      hasAnyOptional,
      maxCost
    );

    return (
      <div className='flex flex-col space-y-2'>
        <div className='flex items-start gap-0.5 sm:gap-1 md:gap-2 lg:gap-4'>
          <Tooltip content={tooltipContent} className='border-none'>
            <div
              className={clsx(
                'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                containerClass
              )}
            >
              {maxCost}
            </div>
          </Tooltip>

          <div className='flex min-w-0 flex-1'>
            <TreeCardDisplay
              tree={treeStructure}
              isEditMode={isEditMode}
              isSqueezedView={isSqueezedView}
              handleSelectCard={handleSelectCard}
              characterId={characterId}
              getCardRank={getCardRank}
              imageBasePath={imageBasePath}
              isOptionalCard={(cardId) => cardId === 'C-狡诈' && hasAnyOptional}
              isFoldedMode={isMobile}
              isDarkMode={isDarkMode}
              isHybridMode={isHybridMode}
            />
          </div>

          {isEditMode && (
            <div className='flex flex-col gap-2'>
              <button
                type='button'
                aria-label='编辑知识卡组'
                onClick={() => handleEditClick(index)}
                className='flex h-8 w-8 items-center justify-center rounded-md bg-blue-500 text-xs text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                  stroke='currentColor'
                  className='h-4 w-4'
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
                className='flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
              >
                <TrashIcon className='h-4 w-4' aria-hidden='true' />
              </button>
            </div>
          )}
        </div>

        <GroupMetaRow
          contributor={contributor}
          contributorInformation={contributorInformation}
          isEditMode={isEditMode}
          isDarkMode={isDarkMode}
          missingWarningMessage={missingWarningMessage}
          priorityWarning={priorityWarning}
        />

        <GroupDescriptionBlock
          description={description}
          isEditMode={isEditMode}
          descriptionPath={descriptionPath}
        />
      </div>
    );
  } else {
    // Flat mode: flatten and render multiple groups
    const flattenedCombinations = flattenCardGroup(normalizedGroup);

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
              contributor={contributor}
              contributorInformation={contributorInformation}
              isDarkMode={isDarkMode}
              getCardPriority={getCardPriority}
            />
            {subIndex < flattenedCombinations.length - 1 && (
              <div className='my-2 border-t border-gray-300 dark:border-slate-600'></div>
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
    () =>
      ((typeof localStorage != 'undefined' && localStorage.getItem('view-mode')) ||
        ('tree' as const)) as ViewMode
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
    if (!hasTreeStructure && viewMode === 'hybrid' /* || viewMode === 'tree-folded' */) {
      setViewMode('tree');
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

  const getCardPriority = (cardId: string) => {
    const cardName = cardId.split('-')[1];
    if (!cardName) return undefined;

    const cardData =
      factionId === 'cat' ? catKnowledgeCards[cardName] : mouseKnowledgeCards[cardName];
    return cardData?.priority;
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
      const flattened = flattenCardGroup(top.cards as unknown as readonly CardGroup[]);
      initialSelectedCards = flattened[0] || [];
    } else if (!('cards' in top) && 'groups' in top && currentTarget.innerIndex !== undefined) {
      const inner = top.groups[currentTarget.innerIndex];
      if (inner) {
        const flattened = flattenCardGroup(inner.cards as unknown as readonly CardGroup[]);
        initialSelectedCards = flattened[0] || [];
      }
    }
  }

  const cycleViewMode = () => {
    const availableModes: ViewMode[] = hasTreeStructure
      ? ['tree', 'hybrid', 'compact']
      : ['tree', 'compact'];

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
    if (viewMode === 'tree') return '图片视图';
    // if (viewMode === 'tree-folded') return '折叠树状视图';
    if (viewMode === 'hybrid') return '混合视图';
    // if (viewMode === 'flat') return hasTreeStructure ? '扁平视图' : '图片视图';
    return '紧凑视图';
  };

  const isTwoModeCycle = !hasTreeStructure;
  const viewToggleButtonClass = clsx(
    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
    isTwoModeCycle
      ? viewMode === 'compact'
        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
  );
  const viewToggleIconClass = clsx(
    'w-4 h-4 transition-transform duration-200',
    viewMode === 'compact' ? 'rotate-90' : 'rotate-180'
  );

  if (!knowledgeCardGroups || knowledgeCardGroups.length === 0) {
    if (isEditMode) {
      return (
        <div>
          <CharacterSection title='推荐知识卡组'>
            <div className='card space-y-3 p-4 dark:border-slate-700 dark:bg-slate-800'>
              <div className='mb-4 flex items-center justify-between'>
                <button
                  type='button'
                  onClick={cycleViewMode}
                  className={viewToggleButtonClass}
                  aria-label={`当前: ${getViewModeLabel()}`}
                >
                  {isTwoModeCycle && (
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth='2'
                      stroke='currentColor'
                      className={viewToggleIconClass}
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M8.25 13.75L12 10L15.75 13.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  )}
                  {getViewModeLabel()}
                </button>
                <button
                  type='button'
                  aria-label='添加知识卡组'
                  onClick={onCreateGroup}
                  className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
                >
                  <PlusIcon className='h-4 w-4' aria-hidden='true' />
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
        <div className='card space-y-3 p-4 dark:border-slate-700 dark:bg-slate-800'>
          <div className='mb-4 flex items-center justify-between'>
            <button
              type='button'
              onClick={cycleViewMode}
              className={viewToggleButtonClass}
              aria-label={`当前: ${getViewModeLabel()}`}
            >
              {isTwoModeCycle && (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                  stroke='currentColor'
                  className={viewToggleIconClass}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M8.25 13.75L12 10L15.75 13.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              )}
              {getViewModeLabel()}
            </button>
            {isEditMode && (
              <button
                type='button'
                aria-label='添加知识卡组'
                onClick={onCreateGroup}
                className='flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500 text-xs text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
              >
                <PlusIcon className='h-4 w-4' aria-hidden='true' />
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
                  getCardPriority={getCardPriority}
                />
                {index < knowledgeCardGroups.length - 1 && (
                  <div className='my-4 border-t border-gray-200 dark:border-slate-700'></div>
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
                  getCardPriority={getCardPriority}
                />
                {index < knowledgeCardGroups.length - 1 && (
                  <div className='my-4 border-t border-gray-200 dark:border-slate-700'></div>
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
