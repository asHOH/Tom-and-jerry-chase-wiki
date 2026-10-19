import { getFactionButtonColors } from '@/lib/design';
import { FACTION_FULL_NAMES } from '@/constants/factions';
import { Achievement } from '@/data/types';
import CatalogCard from '@/components/ui/CatalogCard';
import Tag from '@/components/ui/Tag';

export default function AchievementCardDisplay({ achievement }: { achievement: Achievement }) {
  return (
    <CatalogCard
      title={achievement.name}
      imageSrc={achievement.imageUrl}
      imageAlt=''
      href={`/achievements/${achievement.factionId}/${encodeURIComponent(achievement.name)}`}
      ariaLabel={`查看${achievement.name}成就详情`}
      tagsAriaLabel='成就阵营'
      tags={
        <>
          <Tag
            size='xs'
            margin='compact'
            colorStyles={getFactionButtonColors(achievement.factionId)}
          >
            {FACTION_FULL_NAMES[achievement.factionId]}
          </Tag>
          <Tag
            size='xs'
            margin='compact'
            colorStyles={getFactionButtonColors(achievement.factionId)}
          >
            {achievement.score}分
          </Tag>
        </>
      }
    />
  );
}
