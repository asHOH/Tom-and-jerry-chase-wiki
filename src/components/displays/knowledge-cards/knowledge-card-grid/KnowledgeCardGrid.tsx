import KnowledgeCardDisplay from './KnowledgeCardDisplay';
import { getCardRankColors } from '@/lib/design-tokens';
import { sortCardsByRank } from '@/lib/sortingUtils';
import { useFilterState, filterByRank, RANK_OPTIONS } from '@/lib/filterUtils';
import { KnowledgeCardGridProps } from '@/lib/types';

export default function KnowledgeCardGrid({ faction, onSelectCard }: KnowledgeCardGridProps) {
  // Use centralized filter state management
  const {
    selectedFilters: selectedRanks,
    toggleFilter: toggleRankFilter,
    hasFilter,
  } = useFilterState<string>();

  // Filter and sort cards using centralized utilities
  const filteredAndSortedCards = sortCardsByRank(filterByRank(faction.cards, selectedRanks));

  return (
    <div className='space-y-8'>
      {' '}
      {/* Padding for navbar is now handled at the page level */}
      <header className='text-center space-y-6 mb-10 px-4'>
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
          <span className='text-lg font-medium text-gray-700'>等级筛选:</span>
          <div className='flex gap-2'>
            {RANK_OPTIONS.map((rank) => {
              const rankColors = getCardRankColors(rank, true);
              const isActive = hasFilter(rank);

              const buttonStyle = isActive
                ? {
                    ...rankColors,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    borderWidth: '1px',
                    borderStyle: 'solid',
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
              onClick={onSelectCard}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
