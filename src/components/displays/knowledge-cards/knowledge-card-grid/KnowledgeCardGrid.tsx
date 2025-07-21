'use client';

import KnowledgeCardDisplay from './KnowledgeCardDisplay';
import { getCardRankColors } from '@/lib/design-tokens';

// Faction button color utility
function getFactionButtonColors(
  faction: 'cat' | 'mouse',
  isDarkMode: boolean
): { backgroundColor: string; color: string } {
  if (faction === 'cat') {
    return isDarkMode
      ? { backgroundColor: '#fbbf24', color: '#000000' } // dark: bright yellow-400 bg, black text
      : { backgroundColor: '#fef9c3', color: '#b45309' }; // light: yellow-100 bg, yellow-800 text
  } else {
    return isDarkMode
      ? { backgroundColor: '#38bdf8', color: '#000000' } // dark: bright sky-400 bg, black text
      : { backgroundColor: '#e0f2fe', color: '#0369a1' }; // light: sky-100 bg, sky-800 text
  }
}
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
import FilterLabel from '@/components/ui/FilterLabel';

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
  const [selectedFaction, setSelectedFaction] = useState<'cat' | 'mouse' | null>(null);

  const { handleSelectCard } = useAppContext();

  // Filter and sort cards using centralized utilities
  const filteredAndSortedCards = sortCardsByRank(
    Object.values(cards)
      .filter(createRankFilter(selectedRanks))
      .filter((card) => card.cost >= costRange[0] && card.cost <= costRange[1])
      .filter((card) => !selectedFaction || card.factionId === selectedFaction)
  );

  return (
    <div className='space-y-8 dark:text-slate-200'>
      {' '}
      {/* Padding for navbar is now handled at the page level */}
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>知识卡</PageTitle>
        <PageDescription>提升猫击倒、放飞老鼠的能力与老鼠生存、救援和推奶酪的能力</PageDescription>
        {/* Faction Filter Controls */}
        <div className='flex justify-center items-center gap-4 mt-8'>
          <FilterLabel displayMode='inline'>阵营筛选:</FilterLabel>
          <FilterLabel displayMode='block'>筛选:</FilterLabel>
          <div className='flex gap-2'>
            {(['cat', 'mouse'] as const).map((factionName) => {
              const factionColor = getFactionButtonColors(factionName, isDarkMode);
              const isActive = factionName == selectedFaction;

              return (
                <button
                  type='button'
                  key={factionName}
                  onClick={() => {
                    if (isActive) {
                      setSelectedFaction(null); // Clear selection if already active
                    } else {
                      setSelectedFaction(factionName);
                    }
                  }}
                  className={clsx(
                    'px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
                    !isActive &&
                      'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                  )}
                  style={
                    isActive
                      ? { backgroundColor: factionColor.backgroundColor, color: factionColor.color }
                      : {}
                  }
                >
                  {factionName == 'cat' ? '猫阵营' : '鼠阵营'}
                </button>
              );
            })}
          </div>
        </div>
        {/* Rank Filter Controls */}
        <div className='flex justify-center items-center gap-4 mt-8'>
          <FilterLabel displayMode='inline'>等级筛选:</FilterLabel>
          <FilterLabel displayMode='block'>筛选:</FilterLabel>
          <div className='flex gap-2'>
            {RANK_OPTIONS.map((rank) => {
              const rankColors = getCardRankColors(rank, false, isDarkMode);
              const isActive = hasRankFilter(rank);

              return (
                <button
                  type='button'
                  key={rank}
                  onClick={() => toggleRankFilter(rank)}
                  className={clsx(
                    'px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
                    !isActive &&
                      'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                  )}
                  style={
                    isActive
                      ? { backgroundColor: rankColors.backgroundColor, color: rankColors.color }
                      : {}
                  }
                >
                  {rank}级
                </button>
              );
            })}
          </div>
        </div>
        {/* Cost Filter Controls */}
        <div className='flex flex-col sm:flex-row sm:justify-center items-start gap-4'>
          <FilterLabel displayMode='inline'>费用筛选:</FilterLabel>
          <div className='w-full max-w-md'>
            <CostRangeSlider
              min={2}
              max={7}
              value={costRange}
              onChange={setCostRange}
              className='px-4'
            />
          </div>
        </div>
      </header>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8'>
        {' '}
        {filteredAndSortedCards.map((card) => (
          <div key={card.id} className='transform transition-transform hover:-translate-y-1'>
            <KnowledgeCardDisplay
              id={card.id}
              name={card.id}
              rank={card.rank}
              cost={card.cost}
              imageUrl={card.imageUrl}
              onClick={handleSelectCard}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
