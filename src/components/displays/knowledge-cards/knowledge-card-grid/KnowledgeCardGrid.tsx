'use client';

import KnowledgeCardDisplay from './KnowledgeCardDisplay';
import { getCardRankColors } from '@/lib/design-tokens';
import { getFactionButtonColors } from '@/lib/design-system';
import type { FactionId } from '@/data/types';

import { sortCardsByRank } from '@/lib/sortingUtils';
import { useFilterState, createRankFilter, RANK_OPTIONS } from '@/lib/filterUtils';
import CostRangeSlider from '../../../ui/CostRangeSlider';
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import clsx from 'clsx';
import { useDarkMode } from '@/context/DarkModeContext';
import { cards } from '@/data';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterRow from '@/components/ui/FilterRow';

export default function KnowledgeCardGrid() {
  // Use centralized filter state management for ranks
  const {
    selectedFilters: selectedRanks,
    toggleFilter: toggleRankFilter,
    hasFilter: hasRankFilter,
  } = useFilterState<string>();
  const [isDarkMode] = useDarkMode();

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
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>知识卡</PageTitle>
        <PageDescription>提升猫击倒、放飞老鼠的能力与老鼠生存、救援和推奶酪的能力</PageDescription>
        {/* Filters wrapper */}
        <div className='space-y-0 mx-auto w-full max-w-2xl md:px-2'>
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
          <div className='filter-section flex flex-col md:flex-row md:items-center gap-2 md:gap-4'>
            <div className='label-col w-full md:w-32 text-left'>
              <div className='font-medium'>费用筛选:</div>
            </div>
            <div className='w-full min-w-0 flex justify-center'>
              <div
                className={clsx(
                  'flex w-full max-w-md items-center px-2 rounded-lg',
                  isDarkMode ? 'bg-slate-800 text-gray-300' : 'bg-gray-100 text-gray-700'
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
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
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
              priority={index < 6}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
