'use client';

import { useMemo, useState } from 'react';

import { getFactionButtonColors } from '@/lib/design';
import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { usePublishedRevision } from '@/hooks/usePublishedRevision';
import { useDarkMode } from '@/context/DarkModeContext';
import { achievements } from '@/data/static';
import type { Achievement } from '@/data/types';
import { CatalogGrid, CatalogGridItem } from '@/components/ui/CatalogGrid';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';

import AchievementCardDisplay from './AchievementCardDisplay';

type AchievementGridProps = {
  data?: PublishedGameDataByType['achievements'];
  publishedRevision?: `v1:${string}`;
};

export default function AchievementGridClient({
  data = achievements,
  publishedRevision,
}: AchievementGridProps) {
  usePublishedRevision(publishedRevision);
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse')[]>([]);
  const [isDarkMode] = useDarkMode();

  const editRuntime = useActiveEditRuntime();
  const achievementsSnapshot = useOptionalEditSnapshot(editRuntime?.stores.achievements, data);
  const allAchievements = [
    ...Object.values(achievementsSnapshot.cat),
    ...Object.values(achievementsSnapshot.mouse),
  ] as unknown as Achievement[];
  const filteredAchievements = allAchievements.filter((achievement) => {
    if (selectedFactions.length === 0) return true;
    return selectedFactions.includes(achievement.factionId);
  });

  const achievementCardNodes = useMemo(() => {
    return filteredAchievements.map((achievement) => (
      <CatalogGridItem key={`${achievement.factionId}-${achievement.name}`} clip>
        <AchievementCardDisplay achievement={achievement} />
      </CatalogGridItem>
    ));
  }, [filteredAchievements]);

  return (
    <CatalogPageShell
      title='对局成就'
      description='获取对局评分的方式'
      filters={
        <FilterRow<'cat' | 'mouse'>
          label='阵营筛选:'
          options={['cat', 'mouse']}
          isActive={(f) => selectedFactions.includes(f)}
          onToggle={(f) =>
            setSelectedFactions((prev) =>
              prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
            )
          }
          getOptionLabel={(f) => (f === 'cat' ? '猫阵营' : '鼠阵营')}
          getButtonStyle={(f, active) =>
            active ? getFactionButtonColors(f, isDarkMode) : undefined
          }
        />
      }
    >
      <CatalogGrid
        items={achievementCardNodes}
        minItemWidth={120}
        mobileMinItemWidth={100}
        estimatedRowHeight={200}
        mobileEstimatedRowHeight={170}
      />
    </CatalogPageShell>
  );
}
