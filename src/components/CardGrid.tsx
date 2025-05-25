import CardItem from './CardItem';

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
  // Sort cards by rank (S > A > B > C) and then by name
  const sortedCards = [...faction.cards].sort((a, b) => {
    const rankOrder = { 'S': 4, 'A': 3, 'B': 2, 'C': 1 };
    const rankA = rankOrder[a.rank as keyof typeof rankOrder] || 0;
    const rankB = rankOrder[b.rank as keyof typeof rankOrder] || 0;

    if (rankA !== rankB) {
      return rankB - rankA; // Higher rank first
    }

    return a.name.localeCompare(b.name); // Then by name
  });

  return (
    <div className="space-y-8"> {/* Padding for navbar is now handled at the page level */}
      <header className="text-center space-y-6 mb-10 px-4">
        <h1 className="text-4xl font-bold text-blue-600 py-3">{faction.name === '猫阵营' ? '猫方知识卡' : '鼠方知识卡'}</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto px-4 py-2">
          {faction.name === '猫阵营' ? '知识卡可以增强猫击倒和放飞老鼠的能力' : '知识卡可以提升老鼠的生存、救援和推奶酪能力'}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-8">
        {sortedCards.map((card) => (
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
