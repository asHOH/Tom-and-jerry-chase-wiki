import { getFactionButtonColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { Achievement } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function AchievementCardDisplay({ achievement }: { achievement: Achievement }) {
  const [isDarkMode] = useDarkMode();

  return (
    <CatalogCard
      title={achievement.name}
      imageSrc={achievement.imageUrl}
      imageAlt=''
      ariaLabel={`查看${achievement.name}成就详情`}
      tagsAriaLabel='成就阵营'
      tags={
        <Tag
          size='xs'
          margin='compact'
          colorStyles={getFactionButtonColors(achievement.factionId, isDarkMode)}
        >
          {achievement.factionId === 'cat' ? '猫阵营' : '鼠阵营'}
        </Tag>
      }
    />
  );
}
