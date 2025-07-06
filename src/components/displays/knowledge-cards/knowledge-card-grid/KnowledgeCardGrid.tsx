import KnowledgeCardDisplay from './KnowledgeCardDisplay';
import { getCardRankColors } from '@/lib/design-tokens';
import { sortCardsByRank } from '@/lib/sortingUtils';
import { useFilterState, createRankFilter, RANK_OPTIONS } from '@/lib/filterUtils';
import { KnowledgeCardGridProps } from '@/lib/types';
import CostRangeSlider from '../../../ui/CostRangeSlider';
import { useState } from 'react';
import { useAppContext } from '@/context/AppContext';

export default function KnowledgeCardGrid({ faction }: KnowledgeCardGridProps) {
  // Use centralized filter state management for ranks
  const {
    selectedFilters: selectedRanks,
    toggleFilter: toggleRankFilter,
    hasFilter: hasRankFilter,
  } = useFilterState<string>();

  const isCatFaction = faction.name === '猫阵营';

  // Cost range state with faction-specific initial values
  const [costRange, setCostRange] = useState<[number, number]>(() =>
    isCatFaction ? [2, 7] : [3, 6]
  );

  const { handleSelectCard } = useAppContext();

  // Filter and sort cards using centralized utilities
  const filteredAndSortedCards = sortCardsByRank(
    faction.cards
      .filter(createRankFilter(selectedRanks))
      .filter((card) => card.cost >= costRange[0] && card.cost <= costRange[1])
  );

  return (
    <div className='space-y-8'>
      {' '}
      {/* Padding for navbar is now handled at the page level */}
      <header className='text-center space-y-4 mb-8 px-4'>
        <h1 className='text-4xl font-bold text-blue-600 py-3'>
          {faction.name === '猫阵营' ? '猫方知识卡' : '鼠方知识卡'}
        </h1>
        <p className='text-xl text-gray-600 max-w-3xl mx-auto px-4 py-2'>
          {faction.name === '猫阵营'
            ? '提升猫击倒和放飞老鼠的能力'
            : '提升老鼠的生存、救援和推奶酪能力'}
        </p>
        {/* Rank Filter Controls */}
        <div className='flex justify-center items-center gap-4 mt-8'>
          <span className='text-lg font-medium text-gray-700 hidden sm:inline'>等级筛选:</span>
          <span className='text-lg font-medium text-gray-700 sm:hidden'>筛选:</span>
          <div className='flex gap-2'>
            {RANK_OPTIONS.map((rank) => {
              const rankColors = getCardRankColors(rank, false);
              const isActive = hasRankFilter(rank);

              const buttonStyle = isActive
                ? {
                    ...rankColors,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                  }
                : {
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    fontSize: '14px',
                    backgroundColor: '#f3f4f6',
                    color: '#9ca3af',
                    ':hover': {
                      backgroundColor: '#e5e7eb',
                    },
                  };

              return (
                <button
                  type='button'
                  key={rank}
                  onClick={() => toggleRankFilter(rank)}
                  style={buttonStyle}
                  className={!isActive ? 'hover:bg-gray-200' : ''}
                >
                  {rank}级
                </button>
              );
            })}
          </div>
        </div>
        {/* Cost Filter Controls */}
        <div className='flex flex-col sm:flex-row sm:justify-center items-start gap-4'>
          <span className='text-lg font-medium text-gray-700 hidden sm:inline sm:mt-2'>
            费用筛选:
          </span>
          <div className='w-full max-w-md'>
            <CostRangeSlider
              min={isCatFaction ? 2 : 3}
              max={isCatFaction ? 7 : 6}
              value={costRange}
              onChange={setCostRange}
              className='px-4'
            />
          </div>
        </div>
      </header>{' '}
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8'>
        {' '}
        {filteredAndSortedCards.map((card) => (
          <div key={card.id} className='transform transition-transform hover:-translate-y-1'>
            <KnowledgeCardDisplay
              id={card.id}
              name={card.name}
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
