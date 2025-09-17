import { getCardRankColors, getCardCostColors } from '@/lib/design-tokens';
import { KnowledgeCardDisplayProps } from '@/lib/types';
import GameImage from '../../../ui/GameImage';
import Tag from '../../../ui/Tag';
import BaseCard from '../../../ui/BaseCard';
import { useDarkMode } from '@/context/DarkModeContext';
import { useMobile } from '@/hooks/useMediaQuery';

export default function KnowledgeCardDisplay({
  id,
  name,
  rank,
  cost,
  imageUrl,
  priority = false,
}: KnowledgeCardDisplayProps & { priority?: boolean }) {
  const [isDarkMode] = useDarkMode();
  const rankColors = getCardRankColors(rank, false, isDarkMode);
  const costColors = getCardCostColors(cost, false, isDarkMode);
  const isMobile = useMobile();

  return (
    <BaseCard
      variant='item'
      href={`/cards/${id}`}
      role='button'
      aria-label={`查看${name}知识卡详情，${rank}级，${cost}费`}
    >
      <GameImage
        src={imageUrl}
        alt={`${name}知识卡图标`}
        size='KNOWLEDGECARD_CARD'
        className='hover:scale-105'
        priority={priority}
        useShortHeight={isMobile ? true : false}
      />
      <div className='px-3 pt-1 pb-3 text-center'>
        <h3 className='text-lg font-bold text-gray-800 dark:text-white mb-1'>{name}</h3>
        <div
          className='flex justify-center items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='卡片属性'
        >
          <Tag colorStyles={rankColors} size='xs' margin='compact'>
            {rank}级
          </Tag>
          <Tag colorStyles={costColors} size='xs' margin='compact'>
            {cost}费
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
