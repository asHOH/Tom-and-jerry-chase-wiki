'use client';

import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { getFactionButtonColors } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import { achievementsEdit } from '@/data/store';
import type { Achievement } from '@/data/types';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import { VirtualGrid } from '@/components/ui/VirtualGrid';
import Link from '@/components/Link';

import AchievementCardDisplay from './AchievementCardDisplay';

export default function AchievementGridClient() {
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse')[]>([]);
  const [isDarkMode] = useDarkMode();

  const achievementsSnapshot = useSnapshot(achievementsEdit);
  const filteredAchievements = Object.values(
    achievementsSnapshot as Record<string, Achievement>
  ).filter((achievement: Achievement) => {
    if (selectedFactions.length === 0) return true;
    return selectedFactions.includes(achievement.factionId);
  });

  const achievementCardNodes = useMemo(() => {
    return filteredAchievements.map((achievement) => (
      <div
        key={achievement.name}
        className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
      >
        <Link href={`/achievements/${encodeURIComponent(achievement.name)}`} className='block'>
          <AchievementCardDisplay achievement={achievement} />
        </Link>
      </div>
    ));
  }, [filteredAchievements]);

  return (
    <CatalogPageShell
      title='对局成就'
      description='获取对局评分的有效方式'
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
      <VirtualGrid
        items={achievementCardNodes}
        rowClassName='auto-fit-grid grid-container grid'
        minItemWidth={120}
        gapPx={16}
        estimatedRowHeight={200}
      />
    </CatalogPageShell>
  );
}
