'use client';

import GameImage from '@/components/ui/GameImage';
import { specialSkills } from '@/data';
import type { FactionId } from '@/data/types';
import { useState } from 'react';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import BaseCard from '@/components/ui/BaseCard';
import { getFactionButtonColors } from '@/lib/design-system';
import { useDarkMode } from '@/context/DarkModeContext';
import FilterRow from '@/components/ui/FilterRow';
import { useMobile } from '@/hooks/useMediaQuery';

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
          ? 'max-w-3xl mx-auto p-2 space-y-2 dark:text-slate-200'
          : 'max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'text-center space-y-2 mb-4 px-2' : 'text-center space-y-4 mb-8 px-4'}
      >
        <PageTitle>特技</PageTitle>
        {!isMobile && <PageDescription>{description ?? ''}</PageDescription>}
        {/* Filters wrapper */}
        <div className='space-y-0 mx-auto w-full max-w-2xl md:px-2'>
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
        className='auto-fit-grid grid-container grid gap-4 mt-8'
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
                className='hover:scale-105'
                style={isMobile ? { height: '8rem' } : {}}
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
