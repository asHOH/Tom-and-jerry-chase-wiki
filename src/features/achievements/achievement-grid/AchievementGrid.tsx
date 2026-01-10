'use client';

import { useState } from 'react';
import { useSnapshot } from 'valtio';

import { getFactionButtonColors } from '@/lib/design-system';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { achievementsEdit } from '@/data/store';
import type { Achievement } from '@/data/types';
import FilterRow from '@/components/ui/FilterRow';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Link from '@/components/Link';

import AchievementCardDisplay from './AchievementCardDisplay';

export default function AchievementGridClient() {
  const [selectedFactions, setSelectedFactions] = useState<('cat' | 'mouse')[]>([]);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const achievementsSnapshot = useSnapshot(achievementsEdit);
  const filteredAchievements = Object.values(
    achievementsSnapshot as Record<string, Achievement>
  ).filter((achievement: Achievement) => {
    if (selectedFactions.length === 0) return true;
    return selectedFactions.includes(achievement.factionId);
  });

  return (
    <div
      className={
        isMobile
          ? 'max-w-1xl mx-auto space-y-1 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header className={isMobile ? 'mb-4 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}>
        <PageTitle>对局成就</PageTitle>
        <PageDescription>获取对局评分的有效方式</PageDescription>
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
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
        </div>
      </header>
      <div
        className={`auto-fit-grid grid-container grid ${isMobile ? '' : 'gap-4'} mt-8`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '120px' : '150px'}, 1fr))`,
        }}
      >
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.name}
            className='character-card transform overflow-hidden rounded-lg transition-transform hover:-translate-y-1'
          >
            <Link href={`/achievements/${encodeURIComponent(achievement.name)}`} className='block'>
              <AchievementCardDisplay achievement={achievement} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
