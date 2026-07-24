'use client';

import { useMemo, useState } from 'react';

import { getFactionButtonColors } from '@/lib/design';
import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import type { PublishedGameDataByType } from '@/lib/gameData/published/types';
import { usePublishedRevision } from '@/hooks/usePublishedRevision';
import { useDarkMode } from '@/context/DarkModeContext';
import { specialSkills } from '@/data/static';
import type { FactionId } from '@/data/types';
import { CatalogGrid, CatalogGridItem } from '@/components/ui/CatalogGrid';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import EntityCardFrame from '@/components/ui/EntityCardFrame';
import FilterRow from '@/components/ui/FilterRow';
import GameImage from '@/components/ui/GameImage';

type Props = {
  description?: string;
  data?: PublishedGameDataByType['specialSkills'];
  publishedRevision?: `v1:${string}`;
};

export default function SpecialSkillClient({
  description,
  data = specialSkills,
  publishedRevision,
}: Props) {
  usePublishedRevision(publishedRevision);
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [isDarkMode] = useDarkMode();

  const editRuntime = useActiveEditRuntime();
  const specialSkillsSnapshot = useOptionalEditSnapshot(editRuntime?.stores.specialSkills, data);
  const allSkills = [
    ...Object.values(specialSkillsSnapshot.cat),
    ...Object.values(specialSkillsSnapshot.mouse),
  ];

  const filteredSkills = selectedFaction
    ? allSkills.filter((skill) => skill.factionId === selectedFaction)
    : allSkills;

  const skillCardNodes = useMemo(() => {
    return filteredSkills.map((skill) => (
      <CatalogGridItem key={skill.factionId + skill.name}>
        <EntityCardFrame
          variant='catalog'
          href={`/special-skills/${encodeURIComponent(skill.factionId)}/${encodeURIComponent(skill.name)}`}
          aria-label={`查看${skill.name}特技详情`}
        >
          <GameImage
            src={skill.imageUrl}
            alt=''
            size='SPECIAL_SKILL_CARD'
            className='h-32 w-auto hover:scale-105 md:h-auto'
          />
          <div className='px-3 pt-1 pb-3 text-center'>
            <div className='font-semibold dark:text-white'>{skill.name}</div>
          </div>
        </EntityCardFrame>
      </CatalogGridItem>
    ));
  }, [filteredSkills]);

  return (
    <CatalogPageShell
      title='特技'
      description={description ?? ''}
      filters={
        <FilterRow<'cat' | 'mouse'>
          label='阵营筛选:'
          options={['cat', 'mouse']}
          isActive={(f) => selectedFaction === f}
          onToggle={(f) => setSelectedFaction(selectedFaction === f ? null : f)}
          getOptionLabel={(f) => (f === 'cat' ? '猫阵营' : '鼠阵营')}
          getButtonStyle={(f, active) =>
            active ? getFactionButtonColors(f, isDarkMode) : undefined
          }
        />
      }
    >
      <CatalogGrid
        items={skillCardNodes}
        minItemWidth={150}
        mobileMinItemWidth={110}
        estimatedRowHeight={240}
        mobileEstimatedRowHeight={180}
      />
    </CatalogPageShell>
  );
}
