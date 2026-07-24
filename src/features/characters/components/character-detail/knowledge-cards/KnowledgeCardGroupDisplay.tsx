'use client';

import React from 'react';
import some from 'lodash-es/some';
import { useSnapshot } from 'valtio';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn, getKnowledgeCardGroupMetaColors } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { contributors, type Contributor } from '@/data/contributors';
import { characters } from '@/data/store';
import type { CardGroup } from '@/data/types';
import {
  buildTreeStructure,
  calculateKnowledgeCardCosts,
  calculateMaxCostForTree,
  flattenCardGroup,
  getKnowledgeCardCostStyles,
  isCardOptional,
} from '@/features/knowledge-cards/utils/sections';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import Tag from '@/components/ui/Tag';
import Tooltip from '@/components/ui/Tooltip';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';

import KnowledgeCardLinkDisplay from './KnowledgeCardLinkDisplay';
import TreeCardDisplay from './TreeCardDisplay';

const e = editable('characters');

const PRIORITY_WARNING_VISIBLE_FROM = Date.parse('2026-09-03T00:00:00+08:00');
const MAX_TIMEOUT_MS = 2_147_483_647;

const subscribeToPriorityWarningVisibility = (onVisible: () => void) => {
  let timeoutId: number | undefined;

  const scheduleVisibilityCheck = () => {
    const remainingTime = PRIORITY_WARNING_VISIBLE_FROM - Date.now();
    if (remainingTime <= 0) {
      onVisible();
      return;
    }

    timeoutId = window.setTimeout(scheduleVisibilityCheck, Math.min(remainingTime, MAX_TIMEOUT_MS));
  };

  if (Date.now() < PRIORITY_WARNING_VISIBLE_FROM) {
    scheduleVisibilityCheck();
  }

  return () => {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  };
};

const useShouldShowPriorityWarnings = () =>
  React.useSyncExternalStore(
    subscribeToPriorityWarningVisibility,
    () => Date.now() >= PRIORITY_WARNING_VISIBLE_FROM,
    () => false
  );

export type ViewMode = 'compact' | 'tree' | 'hybrid';

type WarningMessagesInput = {
  warnTieXue: boolean;
  warnJiuJiuWo: boolean;
  warnRescue: boolean;
};

const buildWarningMessages = ({ warnTieXue, warnJiuJiuWo, warnRescue }: WarningMessagesInput) => {
  const missingWarnings: string[] = [];
  if (warnTieXue) missingWarnings.push('无铁血');
  if (warnJiuJiuWo) missingWarnings.push('无救救我');
  if (warnRescue) missingWarnings.push('无救援卡');

  const missingWarningMessage = missingWarnings.length
    ? `该卡组${missingWarnings.join('、')}，慎用`
    : null;

  return { missingWarningMessage };
};

const getPriorityWarningMessage = (
  cardId: string,
  getCardPriority: (cardId: string) => string | undefined,
  isEditMode: boolean,
  shouldShowPriorityWarnings: boolean
) => {
  if (!shouldShowPriorityWarnings || isEditMode || getCardPriority(cardId) !== '3级质变') {
    return null;
  }

  const cardName = cardId.split('-')[1];
  return cardName ? `${cardName}建议升到三级再佩戴` : null;
};

type GroupMetaRowProps = {
  contributor: string | undefined;
  contributorInformation: Contributor | undefined;
  isEditMode: boolean;
  isDarkMode: boolean;
  missingWarningMessage: string | null;
};

const GroupMetaRow = ({
  contributor,
  contributorInformation,
  isEditMode,
  isDarkMode,
  missingWarningMessage,
}: GroupMetaRowProps) => {
  const shouldShowContributor = !!contributor && !isEditMode;
  if (!shouldShowContributor && !missingWarningMessage) {
    return null;
  }

  const contributorTagStyles = getKnowledgeCardGroupMetaColors('contributor', isDarkMode);
  const warningTagStyles = getKnowledgeCardGroupMetaColors('missingWarning', isDarkMode);

  return (
    <div className='ml-11 flex flex-wrap items-center gap-1 sm:ml-12 md:ml-13 lg:ml-14'>
      {shouldShowContributor && (
        <Tag size='xs' margin='micro' className='opacity-80' colorStyles={contributorTagStyles}>
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
    </div>
  );
};

type GroupDescriptionBlockProps = {
  description: string | undefined;
  isEditMode: boolean;
  descriptionPath: string;
};

type KnowledgeCardGroupFlatProps = {
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
  shouldShowPriorityWarnings: boolean;
  onConvertToGroupSet?: (index: number) => void;
  isGeneral?: boolean;
};

type KnowledgeCardGroupDisplayProps = {
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
  getCardPriority: (cardId: string) => string | undefined;
  onConvertToGroupSet?: (index: number) => void;
  isGeneral?: boolean;
};

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
      className={cn(
        'rounded-lg bg-gray-50 p-2 sm:p-3 dark:bg-slate-700/50',
        'ml-11 sm:ml-12 md:ml-13 lg:ml-14'
      )}
    >
      <e.div
        path={descriptionPath}
        initialValue={description ?? ''}
        className='text-sm text-gray-700 dark:text-gray-300'
        enableEdit={isEditMode}
      />
    </div>
  );
};

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
  shouldShowPriorityWarnings,
  onConvertToGroupSet,
  isGeneral = false,
}: KnowledgeCardGroupFlatProps) {
  const charSnap = useSnapshot(characters[characterId]!);
  const canEdit = isEditMode && !isGeneral;

  if (cards.length === 0 && !canEdit) {
    return null;
  }

  const costInfo = calculateKnowledgeCardCosts(cards, getCardCost);
  const { containerClass, tooltipContent } = getKnowledgeCardCostStyles(
    costInfo.displayCost,
    costInfo.hasOptionalCard,
    costInfo.totalCost
  );
  const isMouseFaction = charSnap?.factionId === 'mouse';
  const hasJiuJiuWo = cards.includes('C-救救我');
  const hasRescueSkill = cards.includes('S-舍己') || cards.includes('S-无畏');
  const hasTieXue = cards.includes('S-铁血');
  const shouldWarnMissingRescueSkill = !canEdit && isMouseFaction && !hasRescueSkill;
  const shouldWarnMissingJiuJiuWo = !canEdit && isMouseFaction && !hasJiuJiuWo;
  const shouldWarnMissingTieXue = !canEdit && isMouseFaction && !hasTieXue;

  const { missingWarningMessage } = buildWarningMessages({
    warnTieXue: shouldWarnMissingTieXue,
    warnJiuJiuWo: shouldWarnMissingJiuJiuWo,
    warnRescue: shouldWarnMissingRescueSkill,
  });

  return (
    <div
      className={cn(
        'flex flex-col transition-all duration-300 ease-in-out',
        isSqueezedView ? 'space-y-1' : 'space-y-2'
      )}
    >
      <div
        className={cn(
          'flex gap-0.5 sm:gap-1 md:gap-2 lg:gap-4',
          isSqueezedView ? 'items-center' : 'items-start'
        )}
      >
        <Tooltip content={tooltipContent} className='border-none'>
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
              containerClass
            )}
          >
            {costInfo.displayCost}
          </div>
        </Tooltip>

        <div
          className={cn(
            'flex min-w-0 flex-1',
            isSqueezedView
              ? 'flex-wrap gap-x-2 gap-y-1.5'
              : 'flex-wrap gap-0 sm:gap-0.5 md:gap-1 lg:gap-2'
          )}
        >
          {cards.map((cardId) => {
            const isOptional = isCardOptional(cardId, costInfo.hasOptionalCard, costInfo.totalCost);
            const priorityWarning = getPriorityWarningMessage(
              cardId,
              getCardPriority,
              canEdit,
              shouldShowPriorityWarnings
            );

            return (
              <KnowledgeCardLinkDisplay
                key={cardId}
                cardId={cardId}
                variant={isSqueezedView ? 'tag' : 'image'}
                imageBasePath={imageBasePath}
                isOptional={isOptional}
                isEditMode={canEdit}
                isDarkMode={isDarkMode}
                characterId={characterId}
                getCardRank={getCardRank}
                handleSelectCard={handleSelectCard}
                priorityWarning={priorityWarning}
              />
            );
          })}
        </div>
        {canEdit && (
          <div className='flex flex-col gap-2'>
            <IconButton
              type='button'
              aria-label='编辑知识卡组'
              onClick={() => handleEditClick(index)}
              variant='edit'
              size='md'
            >
              <PencilSquareIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
            </IconButton>
            <IconButton
              type='button'
              aria-label='添加内部卡组'
              onClick={() => onConvertToGroupSet?.(index)}
              variant='add'
              size='md'
            >
              <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
            </IconButton>
            <IconButton
              type='button'
              aria-label='移除知识卡组'
              onClick={() => onRemoveGroup(index)}
              variant='delete'
              size='md'
            >
              <TrashIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
            </IconButton>
          </div>
        )}
      </div>

      <GroupMetaRow
        contributor={contributor}
        contributorInformation={contributorInformation}
        isEditMode={canEdit}
        isDarkMode={isDarkMode}
        missingWarningMessage={missingWarningMessage}
      />

      <GroupDescriptionBlock
        description={description}
        isEditMode={canEdit}
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
  getCardPriority,
  onConvertToGroupSet,
  isGeneral = false,
}: KnowledgeCardGroupDisplayProps) {
  const charSnap = useSnapshot(characters[characterId]!);
  const [isDarkMode] = useDarkMode();
  const shouldShowPriorityWarnings = useShouldShowPriorityWarnings();
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
  const isMouseFaction = charSnap?.factionId === 'mouse';
  const contributorInformation = contributors.find(
    (item) => item.id === contributor || item.name === contributor
  );
  const canEdit = isEditMode && !isGeneral;

  if (isTreeView) {
    // Tree mode: show tree structure with max cost
    const maxCost = calculateMaxCostForTree(normalizedGroup, getCardCost);
    const treeStructure = buildTreeStructure(normalizedGroup);

    // For optional card handling in tree view
    const allFlatCombinations = flattenCardGroup(normalizedGroup);
    const hasAnyOptional = some(allFlatCombinations, (combo) => combo.includes('C-狡诈'));
    const lacksRescueSkill = some(
      allFlatCombinations,
      (combo) => !combo.includes('S-舍己') && !combo.includes('S-无畏')
    );
    const lacksJiuJiuWo = some(allFlatCombinations, (combo) => !combo.includes('C-救救我'));
    const lacksTieXue = some(allFlatCombinations, (combo) => !combo.includes('S-铁血'));
    const shouldWarnMissingRescueSkill = !canEdit && isMouseFaction && lacksRescueSkill;
    const shouldWarnMissingJiuJiuWo = !canEdit && isMouseFaction && lacksJiuJiuWo;
    const shouldWarnMissingTieXue = !canEdit && isMouseFaction && lacksTieXue;

    const { missingWarningMessage } = buildWarningMessages({
      warnTieXue: shouldWarnMissingTieXue,
      warnJiuJiuWo: shouldWarnMissingJiuJiuWo,
      warnRescue: shouldWarnMissingRescueSkill,
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
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold',
                containerClass
              )}
            >
              {maxCost}
            </div>
          </Tooltip>

          <div className='flex min-w-0 flex-1'>
            <TreeCardDisplay
              tree={treeStructure}
              isEditMode={canEdit}
              isSqueezedView={isSqueezedView}
              handleSelectCard={handleSelectCard}
              characterId={characterId}
              getCardRank={getCardRank}
              imageBasePath={imageBasePath}
              isOptionalCard={(cardId) => cardId === 'C-狡诈' && hasAnyOptional}
              isFoldedMode={isMobile}
              isDarkMode={isDarkMode}
              isHybridMode={isHybridMode}
              getCardPriorityWarning={(cardId) =>
                getPriorityWarningMessage(
                  cardId,
                  getCardPriority,
                  canEdit,
                  shouldShowPriorityWarnings
                )
              }
            />
          </div>

          {canEdit && (
            <div className='flex flex-col gap-2'>
              <IconButton
                type='button'
                aria-label='编辑知识卡组'
                onClick={() => handleEditClick(index)}
                variant='edit'
                size='md'
              >
                <PencilSquareIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
              </IconButton>
              <IconButton
                type='button'
                aria-label='添加内部卡组'
                onClick={() => onConvertToGroupSet?.(index)}
                variant='add'
                size='md'
              >
                <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
              </IconButton>
              <IconButton
                type='button'
                aria-label='移除知识卡组'
                onClick={() => onRemoveGroup(index)}
                variant='delete'
                size='md'
              >
                <TrashIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
              </IconButton>
            </div>
          )}
        </div>

        <GroupMetaRow
          contributor={contributor}
          contributorInformation={contributorInformation}
          isEditMode={canEdit}
          isDarkMode={isDarkMode}
          missingWarningMessage={missingWarningMessage}
        />

        <GroupDescriptionBlock
          description={description}
          isEditMode={canEdit}
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
              isEditMode={canEdit}
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
              shouldShowPriorityWarnings={shouldShowPriorityWarnings}
              {...(onConvertToGroupSet ? { onConvertToGroupSet } : {})}
              isGeneral={isGeneral}
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
