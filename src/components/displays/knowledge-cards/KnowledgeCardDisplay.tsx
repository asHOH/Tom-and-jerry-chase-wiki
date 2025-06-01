import { getCardRankColors, getCardCostColors } from '@/lib/design-tokens';
import { KnowledgeCardDisplayProps } from '@/lib/types';
import GameImage from '../../ui/GameImage';
import Tag from '../../ui/Tag';
import BaseCard from '../../ui/BaseCard';

export default function KnowledgeCardDisplay({ id, name, rank, cost, imageUrl, onClick }: KnowledgeCardDisplayProps) {
  const rankColors = getCardRankColors(rank);
  const costColors = getCardCostColors(cost);
  
  return (
    <BaseCard variant="item" onClick={() => onClick(id)}>
      <GameImage src={imageUrl} alt={name} size="CARD_ITEM" className="hover:scale-105" />
      <div className="px-4 pt-1 pb-4 text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-1">{name}</h3>
        <div className="flex justify-center items-center gap-1.5 text-sm text-gray-600">
          <Tag 
            colorStyles={rankColors}
            size="xs"
            variant="compact"
          >
            {rank}级
          </Tag>
          <Tag 
            colorStyles={costColors}
            size="xs"
            variant="compact"
          >
            {cost}费
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
