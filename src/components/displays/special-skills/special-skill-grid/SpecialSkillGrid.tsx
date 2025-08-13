'use client';

import GameImage from '@/components/ui/GameImage';
import { specialSkills } from '@/data';
import type { FactionId } from '@/data/types';
import { useState } from 'react';
import clsx from 'clsx';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import FilterLabel from '@/components/ui/FilterLabel';
import BaseCard from '@/components/ui/BaseCard';
import { getFactionButtonColors } from '@/lib/design-system';
import { useDarkMode } from '@/context/DarkModeContext';

const allSkills = [...Object.values(specialSkills.cat), ...Object.values(specialSkills.mouse)];

export default function SpecialSkillClient() {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [isDarkMode] = useDarkMode();

  // Filter skills by faction if selected
  const filteredSkills = selectedFaction
    ? allSkills.filter((skill) => skill.factionId === selectedFaction)
    : allSkills;

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>特技</PageTitle>
        <PageDescription>角色可配备的额外技能，合理使用将大幅提高角色能力</PageDescription>
        {/* Faction Filter Controls */}
        <div className='flex justify-center items-center gap-4 mt-8'>
          <FilterLabel displayMode='inline'>阵营筛选:</FilterLabel>
          <FilterLabel displayMode='block'>筛选:</FilterLabel>
          <div className='flex gap-2'>
            {(['cat', 'mouse'] as const).map((factionName) => {
              const isActive = factionName === selectedFaction;
              const factionColor = getFactionButtonColors(factionName, isDarkMode);
              return (
                <button
                  type='button'
                  key={factionName}
                  onClick={() => setSelectedFaction(isActive ? null : factionName)}
                  className={clsx(
                    'px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none',
                    !isActive &&
                      'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                  )}
                  style={
                    isActive
                      ? { backgroundColor: factionColor.backgroundColor, color: factionColor.color }
                      : {}
                  }
                >
                  {factionName === 'cat' ? '猫阵营' : '鼠阵营'}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      <div
        className='auto-fit-grid grid-container grid gap-4 mt-8'
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
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
