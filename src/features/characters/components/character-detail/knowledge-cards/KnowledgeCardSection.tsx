'use client';

import React, { useEffect, useMemo, useState } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn } from '@/lib/design';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import type { CardGroup, FactionId, KnowledgeCardGroup, KnowledgeCardGroupSet } from '@/data/types';
import { catKnowledgeCards } from '@/features/knowledge-cards/data/catKnowledgeCards';
import { mouseKnowledgeCards } from '@/features/knowledge-cards/data/mouseKnowledgeCards';
import { flattenCardGroup } from '@/features/knowledge-cards/utils/sections';
import Card from '@/components/ui/Card';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import KnowledgeCardPicker from '@/components/ui/KnowledgeCardPicker';
import { PlusIcon } from '@/components/icons/CommonIcons';
import { characters } from '@/data';

import CharacterSection from '../sections/CharacterSection';
import { KnowledgeCardGroupDisplay, type ViewMode } from './KnowledgeCardGroupDisplay';
import KnowledgeCardGroupSetDisplay from './KnowledgeCardGroupSetDisplay';

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
): group is DeepReadonly<KnowledgeCardGroupSet> => group != undefined && 'groups' in group;

type KnowledgeCardSectionProps = {
  knowledgeCardGroups: DeepReadonly<(KnowledgeCardGroup | KnowledgeCardGroupSet)[]>;
  factionId: FactionId;
  characterId: string;
  onCreateGroup: () => void;
  onRemoveGroup: (topIndex: number, innerIndex?: number) => void;
};

const normalizeViewMode = (viewMode: string | null): ViewMode => {
  if (viewMode === 'compact' || viewMode === 'tree' || viewMode === 'hybrid') {
    return viewMode;
  }

  return 'tree';
};

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
  const [currentTarget, setCurrentTarget] = useState<{
    topIndex: number;
    innerIndex?: number;
    isGroupSet: boolean;
  } | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    normalizeViewMode(
      typeof localStorage !== 'undefined' ? localStorage.getItem('view-mode') : null
    )
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
  const viewToggleButtonClass = cn(
    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
    isTwoModeCycle
      ? viewMode === 'compact'
        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
  );
  const viewToggleIconClass = cn(
    'w-4 h-4 transition-transform duration-200',
    viewMode === 'compact' ? 'rotate-90' : 'rotate-180'
  );

  if (!knowledgeCardGroups || knowledgeCardGroups.length === 0) {
    if (isEditMode) {
      return (
        <div>
          <CharacterSection title='推荐知识卡组'>
            <Card className='space-y-3 p-4'>
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
                <IconButton
                  type='button'
                  aria-label='添加知识卡组'
                  onClick={onCreateGroup}
                  variant='add'
                  size='md'
                >
                  <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
                </IconButton>
              </div>
            </Card>
          </CharacterSection>
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <CharacterSection title='推荐知识卡组'>
        <Card className='space-y-3 p-4'>
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
              <IconButton
                type='button'
                aria-label='添加知识卡组'
                onClick={onCreateGroup}
                variant='add'
                size='md'
              >
                <PlusIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
              </IconButton>
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
        </Card>
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
