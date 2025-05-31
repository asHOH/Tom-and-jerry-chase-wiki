import { useState } from 'react';
import CardItem from './CardItem';
import { getRankColor } from '@/lib/cardUtils';

type Card = {
  id: string;
  name: string;
  rank: string;
  cost: number;
  imageUrl: string;
};

type Faction = {
  id: string;
  name: string;
  description: string;
  cards: Card[];
};

type CardGridProps = {
  faction: Faction;
  onSelectCard: (cardId: string) => void;
};

export default function CardGrid({ faction, onSelectCard }: CardGridProps) {
  // State for rank filters - all ranks selected by default
  const [selectedRanks, setSelectedRanks] = useState<Set<string>>(new Set(['S', 'A', 'B', 'C']));

  // Toggle rank filter
  const toggleRankFilter = (rank: string) => {
    const newSelectedRanks = new Set(selectedRanks);
    if (newSelectedRanks.has(rank)) {
      newSelectedRanks.delete(rank);
    } else {
      newSelectedRanks.add(rank);
    }
    setSelectedRanks(newSelectedRanks);
  };

  // Filter and sort cards
  const filteredAndSortedCards = [...faction.cards]
    .filter(card => selectedRanks.has(card.rank))
    .sort((a, b) => {
      const rankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
      const rankA = rankOrder[a.rank as keyof typeof rankOrder] || 0;
      const rankB = rankOrder[b.rank as keyof typeof rankOrder] || 0;

      // Primary sort: by rank (S > A > B > C)
      if (rankA !== rankB) {
        return rankB - rankA; // Higher rank first
      }

      // Secondary sort: by cost in descending order (highest cost first)
      return b.cost - a.cost;
    });

  return (
    <div className="space-y-8"> {/* Padding for navbar is now handled at the page level */}
      <header className="text-center space-y-6 mb-10 px-4">
        <h1 className="text-4xl font-bold text-blue-600 py-3">{faction.name === '猫阵营' ? '猫方知识卡' : '鼠方知识卡'}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto px-4 py-2">
          {faction.name === '猫阵营' ? '提升猫击倒和放飞老鼠的能力' : '提升老鼠的生存、救援和推奶酪能力'}
        </p>

        {/* Rank Filter Controls */}
        <div className="flex justify-center items-center gap-4 mt-8">
          <span className="text-lg font-medium text-gray-700">等级筛选:</span>
          <div className="flex gap-2">
            {['S', 'A', 'B', 'C'].map((rank) => (
              <button
                key={rank}
                onClick={() => toggleRankFilter(rank)}
                className={`px-3 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                  selectedRanks.has(rank)
                    ? `${getRankColor(rank, true)} border-current`
                    : 'bg-gray-100 text-gray-400 border-gray-300 hover:bg-gray-200'
                }`}
              >
                {rank}级
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8">
        {filteredAndSortedCards.map((card) => (
          <div key={card.id} className="transform transition-transform hover:-translate-y-1">
            <CardItem
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
