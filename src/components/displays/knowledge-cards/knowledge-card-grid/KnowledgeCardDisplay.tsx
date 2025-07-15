import { getCardRankColors, getCardCostColors } from '@/lib/design-tokens';
import { KnowledgeCardDisplayProps } from '@/lib/types';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';
import { useDarkMode } from '@/context/DarkModeContext';

export default function KnowledgeCardDisplay({
  id,
  name,
  rank,
  cost,
  imageUrl,
  onClick,
}: KnowledgeCardDisplayProps) {
  const [isDarkMode] = useDarkMode();
  const rankColors = getCardRankColors(rank, false, isDarkMode);
  const costColors = getCardCostColors(cost, false, isDarkMode);

  return (
    <BaseCard
      variant='item'
      onClick={() => onClick(id)}
      role='button'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(id);
        }
      }}
      aria-label={`查看${name}知识卡详情，${rank}级，${cost}费`}
    >
      <GameImage
        src={imageUrl}
        alt={`${name}知识卡图标`}
        size='CARD_ITEM'
        className='hover:scale-105'
      />
      <div className='px-4 pt-1 pb-4 text-center'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-white mb-1'>{name}</h3>
        <div
          className='flex justify-center items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='卡片属性'
        >
          <Tag colorStyles={rankColors} size='xs' variant='compact'>
            {rank}级
          </Tag>
          <Tag colorStyles={costColors} size='xs' variant='compact'>
            {cost}费
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
