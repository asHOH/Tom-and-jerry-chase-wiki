'use client';

import { useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';

import { getFactionButtonColors } from '@/lib/design';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import { specialSkillsEdit } from '@/data/store';
import type { FactionId } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import CatalogPageShell from '@/components/ui/CatalogPageShell';
import FilterRow from '@/components/ui/FilterRow';
import GameImage from '@/components/ui/GameImage';
import { VirtualGrid } from '@/components/ui/VirtualGrid';

type Props = { description?: string };

export default function SpecialSkillClient({ description }: Props) {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  const specialSkillsSnapshot = useSnapshot(specialSkillsEdit);
  const allSkills = [
    ...Object.values(specialSkillsSnapshot.cat),
    ...Object.values(specialSkillsSnapshot.mouse),
  ];

  const filteredSkills = selectedFaction
    ? allSkills.filter((skill) => skill.factionId === selectedFaction)
    : allSkills;

  const skillCardNodes = useMemo(() => {
    return filteredSkills.map((skill) => (
      <div
        key={skill.factionId + skill.name}
        className='character-card transform transition-transform hover:-translate-y-1'
      >
        <BaseCard
          variant='item'
          href={`/special-skills/${encodeURIComponent(skill.factionId)}/${encodeURIComponent(skill.name)}`}
          aria-label={`查看${skill.name}特技详情`}
        >
          <GameImage
            src={skill.imageUrl}
            alt={skill.name}
            size='SPECIAL_SKILL_CARD'
            className={`hover:scale-105 ${isMobile ? 'h-32 w-auto' : ''}`}
          />
          <div className='px-3 pt-1 pb-3 text-center'>
            <div className='font-semibold dark:text-white'>{skill.name}</div>
          </div>
        </BaseCard>
      </div>
    ));
  }, [filteredSkills, isMobile]);

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
      <VirtualGrid
        items={skillCardNodes}
        rowClassName='auto-fit-grid grid-container grid'
        minItemWidth={isMobile ? 120 : 150}
        gapPx={16}
        estimatedRowHeight={isMobile ? 210 : 250}
      />
    </CatalogPageShell>
  );
}
