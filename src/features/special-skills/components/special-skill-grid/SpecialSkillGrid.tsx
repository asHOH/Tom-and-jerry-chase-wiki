'use client';

import { useState } from 'react';

import { getFactionButtonColors } from '@/lib/design-system';
import { useMobile } from '@/hooks/useMediaQuery';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId } from '@/data/types';
import BaseCard from '@/components/ui/BaseCard';
import FilterRow from '@/components/ui/FilterRow';
import GameImage from '@/components/ui/GameImage';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import { specialSkills } from '@/data';

const allSkills = [...Object.values(specialSkills.cat), ...Object.values(specialSkills.mouse)];

type Props = { description?: string };

export default function SpecialSkillClient({ description }: Props) {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  // Filter skills by faction if selected
  const filteredSkills = selectedFaction
    ? allSkills.filter((skill) => skill.factionId === selectedFaction)
    : allSkills;

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-4 space-y-2 px-2 text-center' : 'mb-8 space-y-4 px-4 text-center'}
      >
        <PageTitle>特技</PageTitle>
        {!isMobile && <PageDescription>{description ?? ''}</PageDescription>}
        {/* Filters wrapper */}
        <div className='mx-auto w-full max-w-2xl space-y-0 md:px-2'>
          <FilterRow<'cat' | 'mouse'>
            label='阵营筛选:'
            options={['cat', 'mouse']}
            isActive={(f) => selectedFaction === f}
            onToggle={(f) => setSelectedFaction(selectedFaction === f ? null : f)}
            getOptionLabel={(f) => (f === 'cat' ? '猫阵营' : '鼠阵营')}
            getButtonStyle={(f, active) =>
              active ? getFactionButtonColors(f, isDarkMode) : undefined
            }
            isDarkMode={isDarkMode}
          />
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container mt-8 grid gap-4'
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? '100px' : '150px'}, 1fr))`,
        }}
      >
        {filteredSkills.map((skill) => (
          <div
            key={skill.factionId + skill.name}
            className='character-card transform transition-transform hover:-translate-y-1'
          >
            <BaseCard
              variant='item'
              href={`/special-skills/${encodeURIComponent(skill.factionId)}/${encodeURIComponent(
                skill.name
              )}`}
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
        ))}
      </div>
    </div>
  );
}
