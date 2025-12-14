'use client';

import { useState } from 'react';

import { getFactionButtonColors } from '@/lib/design-system';
import { designTokens } from '@/lib/design-tokens';
import { CharacterWithFaction } from '@/lib/types';
import { useDarkMode } from '@/context/DarkModeContext';
import type { FactionId, SpecialSkill } from '@/data/types';
import TextWithHoverTooltips from '@/features/characters/components/shared/TextWithHoverTooltips';
import BaseCard from '@/components/ui/BaseCard';
import FilterRow from '@/components/ui/FilterRow';
import GameImage from '@/components/ui/GameImage';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import { characters, specialSkills } from '@/data';

import AdviceCharacterList from './AdviceCharacterList';

// Filter characters
function allCounters(skill: SpecialSkill) {
  const IsMinor: CharacterWithFaction[] = Object.values(characters).filter(
    (character) =>
      character.countersSpecialSkills?.some((s) => s.id === skill.name && s.isMinor === true) &&
      character.factionId !== skill.factionId
  );
  const UnIsMinor: CharacterWithFaction[] = Object.values(characters).filter(
    (character) =>
      character.countersSpecialSkills?.some((s) => s.id === skill.name && s.isMinor === false) &&
      character.factionId !== skill.factionId
  );
  return { 0: UnIsMinor, 1: IsMinor };
}
function allCounteredBy(skill: SpecialSkill) {
  const IsMinor: CharacterWithFaction[] = Object.values(characters).filter(
    (character) =>
      character.counteredBySpecialSkills?.some((s) => s.id === skill.name && s.isMinor === true) &&
      character.factionId !== skill.factionId
  );
  const UnIsMinor: CharacterWithFaction[] = Object.values(characters).filter(
    (character) =>
      character.counteredBySpecialSkills?.some((s) => s.id === skill.name && s.isMinor === false) &&
      character.factionId !== skill.factionId
  );
  return { 0: UnIsMinor, 1: IsMinor };
}

function allUsers(skill: SpecialSkill) {
  const Return: CharacterWithFaction[] = Object.values(characters).filter(
    (character) =>
      character.specialSkills?.some((s) => s.name === skill.name) &&
      character.factionId === skill.factionId
  );
  return Return;
}

function userQuantity(skill: SpecialSkill) {
  return (
    allCounters(skill)[0].length +
    allCounters(skill)[1].length +
    allCounteredBy(skill)[0].length +
    allCounteredBy(skill)[1].length +
    allUsers(skill).length
  );
}

const allSkills = [
  ...Object.values(specialSkills.cat).sort((a, b) => userQuantity(b) - userQuantity(a)),
  ...Object.values(specialSkills.mouse).sort((a, b) => userQuantity(b) - userQuantity(a)),
];

export default function SpecialSkillAdviceClient() {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [isDarkMode] = useDarkMode();

  // Filter skills by faction if selected
  const filteredSkills = selectedFaction
    ? allSkills.filter((skill) => skill.factionId === selectedFaction)
    : allSkills;

  return (
    <div className='mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'>
      <header className='mb-8 space-y-4 px-4 text-center'>
        <PageTitle>特技推荐</PageTitle>
        <PageDescription>根据各特技的应用场合和克制关系，选择最合适的特技</PageDescription>
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
      <div className='auto-fit-grid grid-container mt-8 grid gap-4'>
        {filteredSkills.map((skill) => (
          <div
            key={skill.factionId + skill.name}
            className='character-card card flex transform flex-col transition-transform md:flex-row dark:border-slate-700 dark:bg-slate-800'
          >
            <div className='md:w-1/5'>
              <BaseCard
                variant='item'
                href={`/special-skills/${encodeURIComponent(skill.factionId)}/${encodeURIComponent(
                  skill.name
                )}`}
                aria-label={`查看${skill.name}特技详情`}
                className='hover:-translate-y-1'
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
            <div
              className='md:w-4/5'
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: designTokens.spacing.sm,
                padding: designTokens.spacing.sm,
              }}
            >
              {/*description*/}
              {skill.adviceDescription !== undefined && (
                <div>
                  <p
                    className='text-lg text-black dark:text-gray-200'
                    style={{
                      paddingTop: designTokens.spacing.sm,
                      paddingBottom: designTokens.spacing.sm,
                    }}
                  >
                    <TextWithHoverTooltips text={skill.adviceDescription as string} />
                  </p>
                </div>
              )}

              {/*counteredBy*/}
              {(allCounteredBy(skill)[0].length != 0 || allCounteredBy(skill)[1].length != 0) && (
                <div>
                  <span className='flex items-center gap-1 text-sm font-semibold text-blue-700 dark:text-blue-300'>
                    <span className='mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-200'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 16 16'
                        fill='none'
                        aria-label='smile'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <circle cx='5' cy='6' r='1.25' fill='#2563eb' />
                        <circle cx='11' cy='6' r='1.25' fill='#2563eb' />
                        <path
                          d='M4 9.5 Q8 12.7 12 9.5'
                          stroke='#2563eb'
                          strokeWidth='2'
                          fill='none'
                          strokeLinecap='round'
                        />
                      </svg>
                    </span>
                    被{skill.name}克制的{skill.factionId == 'cat' ? '老鼠' : '猫咪'}：
                  </span>
                  <AdviceCharacterList
                    characters={allCounteredBy(skill)[0]}
                    isMinorCharacters={allCounteredBy(skill)[1]}
                    color='blue'
                  />
                </div>
              )}

              {/*counters*/}
              {(allCounters(skill)[0].length != 0 || allCounters(skill)[1].length != 0) && (
                <div>
                  <span className='flex items-center gap-1 text-sm font-semibold text-red-700 dark:text-red-300'>
                    <span className='mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-200'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 16 16'
                        fill='none'
                        aria-label='sad'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <circle cx='5' cy='6' r='1.25' fill='#dc2626' />
                        <circle cx='11' cy='6' r='1.25' fill='#dc2626' />
                        <path
                          d='M4 11 Q8 9.5 12 11'
                          stroke='#dc2626'
                          strokeWidth='2'
                          fill='none'
                          strokeLinecap='round'
                        />
                      </svg>
                    </span>
                    克制{skill.name}的{skill.factionId == 'cat' ? '老鼠' : '猫咪'}：
                  </span>
                  <AdviceCharacterList
                    characters={allCounters(skill)[0]}
                    isMinorCharacters={allCounters(skill)[1]}
                    color='red'
                  />
                </div>
              )}

              {/*users*/}
              {allUsers(skill).length != 0 && (
                <div>
                  <span className='flex items-center gap-1 text-sm font-semibold text-green-700 dark:text-green-300'>
                    <span className='mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-200'>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 16 16'
                        fill='none'
                        aria-label='heart'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          d='M8 13 C8 13 3.5 10.5 3.5 7.5 C3.5 6 4.7 4.8 6.2 4.8 C7.1 4.8 7.8 5.2 8 5.9 C8.2 5.2 8.9 4.8 9.8 4.8 C11.3 4.8 12.5 6 12.5 7.5 C12.5 10.5 8 13 8 13 Z'
                          fill='#bbf7d0'
                          stroke='#16a34a'
                          strokeWidth='1.8'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </span>
                    适合携带{skill.name}的{skill.factionId == 'cat' ? '猫咪' : '老鼠'}：
                  </span>
                  <AdviceCharacterList characters={allUsers(skill)} color='green' />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
