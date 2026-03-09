'use client';

import { useId, useState } from 'react';
import { useSnapshot } from 'valtio';

import { getCardRankColors, getFactionButtonColors } from '@/lib/design';
import { createRankFilter, RANK_OPTIONS, useFilterState } from '@/lib/filterUtils';
import { sortCardsByRank } from '@/lib/sortingUtils';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import type { FactionId } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import CostRangeSlider from '@/components/ui/CostRangeSlider';
import FilterLabel from '@/components/ui/FilterLabel';
import FilterRow from '@/components/ui/FilterRow';
import { cards, cardsEdit } from '@/data';

import KnowledgeCardDisplay from './KnowledgeCardDisplay';

type Props = { description?: string };

export default function KnowledgeCardGrid({ description }: Props) {
  const { isEditMode } = useEditMode();
  const cardsEditSnapshot = useSnapshot(cardsEdit);
  const {
    selectedFilters: selectedRanks,
    toggleFilter: toggleRankFilter,
    hasFilter: hasRankFilter,
  } = useFilterState<string>();
  const [isDarkMode] = useDarkMode();
  const [costRange, setCostRange] = useState<[number, number]>([2, 7]);
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const costLabelId = useId();
  const { handleSelectCard } = useAppContext();

  const sourceCards = isEditMode ? cardsEditSnapshot : cards;
  const filteredAndSortedCards = sortCardsByRank(
    Object.values(sourceCards)
      .filter(createRankFilter(selectedRanks))
      .filter((card) => card.cost >= costRange[0] && card.cost <= costRange[1])
      .filter((card) => !selectedFaction || card.factionId === selectedFaction)
  );

  return (
    <CatalogPageShell
      title='知识卡'
      description={description ?? ''}
      filters={
        <>
          <FilterRow<FactionId>
            label='阵营筛选:'
            options={['cat', 'mouse'] as const}
            isActive={(opt) => selectedFaction === opt}
            onToggle={(opt) => setSelectedFaction(selectedFaction === opt ? null : opt)}
            getOptionLabel={(opt) => (opt === 'cat' ? '猫阵营' : '鼠阵营')}
            getButtonStyle={(opt, active) =>
              active ? getFactionButtonColors(opt, isDarkMode) : undefined
            }
          />

          <FilterRow<string>
            label='等级筛选:'
            options={RANK_OPTIONS}
            isActive={(opt) => hasRankFilter(opt)}
            onToggle={(opt) => toggleRankFilter(opt)}
            getOptionLabel={(opt) => `${opt}级`}
            getButtonStyle={(opt, active) =>
              active ? getCardRankColors(opt, false, isDarkMode) : undefined
            }
          />

          <div
            className='filter-section flex flex-col gap-2 md:flex-row md:items-center md:gap-4'
            role='group'
            aria-labelledby={costLabelId}
          >
            <div className='label-col w-full text-left md:w-32'>
              <FilterLabel id={costLabelId} full='费用筛选:' />
            </div>
            <div className='flex w-full min-w-0 justify-center'>
              <div
                className='flex w-full max-w-md items-center rounded-lg bg-transparent px-2 text-gray-700 dark:text-gray-300'
                aria-label='费用筛选'
              >
                <CostRangeSlider
                  min={2}
                  max={7}
                  value={costRange}
                  onChange={setCostRange}
                  className='w-full'
                />
              </div>
            </div>
          </div>
        </>
      }
    >
      <div className='auto-fit-grid grid-container grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-4 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]'>
        {filteredAndSortedCards.map((card, index) => (
          <div
            key={card.id}
            className='character-card transform transition-transform hover:-translate-y-1'
          >
            <KnowledgeCardDisplay
              id={card.id}
              name={card.id}
              rank={card.rank}
              cost={card.cost}
              imageUrl={card.imageUrl}
              onClick={handleSelectCard}
              preload={index < 6}
            />
          </div>
        ))}
      </div>
    </CatalogPageShell>
  );
}
