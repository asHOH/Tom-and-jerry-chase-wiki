import { cn, getFactionButtonColors } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { Achievement } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import Tag from '@/components/ui/Tag';

export default function AchievementCardDisplay({ achievement }: { achievement: Achievement }) {
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  return (
    <BaseCard variant='item' aria-label={`查看${achievement.name}成就详情`}>
      <GameImage
        src={achievement.imageUrl}
        alt={`${achievement.name}成就图标`}
        size='ITEM_CARD'
        className={cn('hover:scale-105', isMobile && 'h-32 w-auto')}
      />
      <div className={cn('w-full pt-1 pb-3 text-center', !isMobile && 'px-3')}>
        <h3
          className={cn(
            'h-6 font-bold whitespace-pre text-gray-800 dark:text-white',
            isMobile && achievement.name.length >= 6 ? 'text-md' : 'mb-1 text-lg'
          )}
        >
          {achievement.name}
        </h3>
        <div
          className='flex flex-wrap items-center justify-center gap-1.5 text-sm text-gray-600 dark:text-gray-300'
          role='group'
          aria-label='成就阵营'
        >
          <Tag
            size='xs'
            margin='compact'
            colorStyles={getFactionButtonColors(achievement.factionId, isDarkMode)}
          >
            {achievement.factionId === 'cat' ? '猫阵营' : '鼠阵营'}
          </Tag>
        </div>
      </div>
    </BaseCard>
  );
}
