'use client';

import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { cards } from '@/data';
import type { FactionId } from '@/data/types';
import clsx from 'clsx';

import { getFactionButtonColors } from '@/lib/design-system';
import { getCardRankColors } from '@/lib/design-tokens';
import { createRankFilter, RANK_OPTIONS, useFilterState } from '@/lib/filterUtils';
import { sortCardsByRank } from '@/lib/sortingUtils';
import { useMobile } from '@/hooks/useMediaQuery';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';

import CostRangeSlider from '../../../ui/CostRangeSlider';
import KnowledgeCardDisplay from './KnowledgeCardDisplay';

type Props = { description?: string };

export default function KnowledgeCardGrid({ description }: Props) {
  // Use centralized filter state management for ranks
  const {
    selectedFilters: selectedRanks,
    toggleFilter: toggleRankFilter,
    hasFilter: hasRankFilter,
  } = useFilterState<string>();
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  // Cost range state with faction-specific initial values
  const [costRange, setCostRange] = useState<[number, number]>([2, 7]);
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);

  const { handleSelectCard } = useAppContext();

  // Filter and sort cards using centralized utilities
  const filteredAndSortedCards = sortCardsByRank(
    Object.values(cards)
      .filter(createRankFilter(selectedRanks))
      .filter((card) => card.cost >= costRange[0] && card.cost <= costRange[1])
      .filter((card) => !selectedFaction || card.factionId === selectedFaction)
  );

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>知识卡</PageTitle>
        {!isMobile && <PageDescription>{description ?? ''}</PageDescription>}
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          <FilterRow<FactionId>
            label='阵营筛选:'
            options={['cat', 'mouse'] as const}
            isActive={(opt) => selectedFaction === opt}
            onToggle={(opt) => setSelectedFaction(selectedFaction === opt ? null : opt)}
            getOptionLabel={(opt) => (opt === 'cat' ? '猫阵营' : '鼠阵营')}
            getButtonStyle={(opt, active) =>
              active ? getFactionButtonColors(opt, isDarkMode) : undefined
            }
            isDarkMode={isDarkMode}
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
            isDarkMode={isDarkMode}
          />

          {/* Cost Filter Controls styled like FilterRow */}
          <div className='filter-section flex flex-col gap-2 md:flex-row md:items-center md:gap-4'>
            <div className='label-col w-full text-left md:w-32'>
              <div className='font-medium'>费用筛选:</div>
            </div>
            <div className='flex w-full min-w-0 justify-center'>
              <div
                className={clsx(
                  'flex w-full max-w-md items-center rounded-lg bg-transparent px-2',
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                )}
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
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '160px'}, 1fr))`,
        }}
      >
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
    </div>
  );
}
