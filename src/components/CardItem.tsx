import { getRankColor, getCostColor } from '@/lib/cardUtils';
import { CardItemProps } from '@/lib/types';
import GameImage from './ui/GameImage';
import Tag from './ui/Tag';
import BaseCard from './ui/BaseCard';

export default function CardItem({ id, name, rank, cost, imageUrl, onClick }: CardItemProps) {
  return (
    <BaseCard variant="item" onClick={() => onClick(id)}>
      <GameImage src={imageUrl} alt={name} size="CARD_ITEM" className="hover:scale-105" />
      
      {/* Card info */}
      <div className="p-4 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{name}</h3>
        <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
          <Tag colorClasses={getRankColor(rank)}>
            {rank}级
          </Tag>
          <Tag colorClasses={getCostColor(cost)}>
            {cost}费
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
