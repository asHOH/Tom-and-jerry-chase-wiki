'use client';

import GameImage from '@/components/ui/GameImage';
import specialSkillsAdvice, { SpecialSkillAdvice } from './SpecialSkillAdivceData';
import type { FactionId } from '@/data/types';
import { useState } from 'react';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import BaseCard from '@/components/ui/BaseCard';
import { getFactionButtonColors } from '@/lib/design-system';
import { useDarkMode } from '@/context/DarkModeContext';
import FilterRow from '@/components/ui/FilterRow';
import { designTokens } from '@/lib/design-tokens';
import TextWithHoverTooltips from '../../characters/shared/TextWithHoverTooltips';
import { characters } from '@/data';
import { CharacterWithFaction } from '@/lib/types';
import Image from '@/components/Image';
import Link from 'next/link';
import { useMobile } from '@/hooks/useMediaQuery';
import clsx from 'clsx';

const allSkillsAdvice = [
  ...Object.values(specialSkillsAdvice.cat),
  ...Object.values(specialSkillsAdvice.mouse),
];

export default function SpecialSkillAdviceClient() {
  const [selectedFaction, setSelectedFaction] = useState<FactionId | null>(null);
  const [isDarkMode] = useDarkMode();
  const isMobile = useMobile();

  // Filter skills by faction if selected
  const filteredSkills = selectedFaction
    ? allSkillsAdvice.filter((skill) => skill.factionId === selectedFaction)
    : allSkillsAdvice;

  // Filter characters
  function allCounteredBy(skill: SpecialSkillAdvice) {
    const IsMinor: CharacterWithFaction[] = Object.values(characters).filter(
      (character) =>
        character.counteredBySpecialSkills?.some(
          (s) => s.id === skill.name && s.isMinor === true
        ) && character.factionId !== skill.factionId
    );
    const UnIsMinor: CharacterWithFaction[] = Object.values(characters).filter(
      (character) =>
        character.counteredBySpecialSkills?.some(
          (s) => s.id === skill.name && s.isMinor === false
        ) && character.factionId !== skill.factionId
    );
    return { 0: UnIsMinor, 1: IsMinor };
  }
  function allCounters(skill: SpecialSkillAdvice) {
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
  function allUsers(skill: SpecialSkillAdvice) {
    const Return: CharacterWithFaction[] = Object.values(characters).filter(
      (character) =>
        character.specialSkills?.some((s) => s.name === skill.name) &&
        character.factionId === skill.factionId
    );
    return Return;
  }

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <PageTitle>特技推荐</PageTitle>
        <PageDescription>根据各特技的应用场合和克制关系，选择最合适的特技</PageDescription>
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
      <div className='auto-fit-grid grid-container grid gap-4 mt-8'>
        {filteredSkills.map((skill) => (
          <div
            key={skill.factionId + skill.name}
            className='character-card transform transition-transform flex flex-col md:flex-row card dark:bg-slate-800 dark:border-slate-700'
          >
            <div className='md:w-1/5 '>
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
              {skill.description !== undefined && (
                <div>
                  <p
                    className='text-black dark:text-gray-200 text-lg'
                    style={{
                      paddingTop: designTokens.spacing.sm,
                      paddingBottom: designTokens.spacing.sm,
                    }}
                  >
                    <TextWithHoverTooltips text={skill.description as string} />
                  </p>
                </div>
              )}

              {/*counteredBy*/}
              {(allCounteredBy(skill)[0].length != 0 || allCounteredBy(skill)[1].length != 0) && (
                <div>
                  <span className='font-semibold text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1'>
                    <span className='w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center mr-1'>
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
                  <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-2 py-2'>
                    <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                      {allCounteredBy(skill)[0].map((character) => (
                        <li
                          key={character.id ?? ''}
                          className='flex items-center gap-4 p-3 rounded-lg transition-colors bg-blue-50 dark:bg-blue-900/30 hover:-translate-y-1'
                        >
                          <Link
                            href={`/characters/${character.id}`}
                            className='flex items-center gap-2 w-full'
                            tabIndex={0}
                          >
                            <Image
                              src={character.imageUrl!}
                              alt={character.id!}
                              className='w-10 h-10'
                              width={40}
                              height={40}
                            />
                            <span className='text-lg dark:text-white truncate'>{character.id}</span>
                          </Link>
                        </li>
                      ))}
                      {allCounteredBy(skill)[1].map((character) => (
                        <li
                          key={character.id ?? ''}
                          className='flex items-center gap-4 p-3 rounded-lg transition-colors bg-blue-50 dark:bg-blue-900/30 opacity-60 hover:-translate-y-1'
                        >
                          <Link
                            href={`/characters/${character.id}`}
                            className='flex items-center gap-2 w-full opacity-80'
                            tabIndex={0}
                          >
                            <Image
                              src={character.imageUrl!}
                              alt={character.id!}
                              className='w-10 h-10'
                              width={40}
                              height={40}
                            />
                            <span className='text-lg dark:text-white truncate'>{character.id}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/*counters*/}
              {(allCounters(skill)[0].length != 0 || allCounters(skill)[1].length != 0) && (
                <div>
                  <span className='font-semibold text-sm text-red-700 dark:text-red-300 flex items-center gap-1'>
                    <span className='w-5 h-5 bg-red-200 rounded-full flex items-center justify-center mr-1'>
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
                  <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-2 py-2'>
                    <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                      {allCounters(skill)[0].map((character) => (
                        <li
                          key={character.id ?? ''}
                          className='flex items-center gap-4 p-3 rounded-lg transition-colors bg-red-50 dark:bg-red-900/30 hover:-translate-y-1'
                        >
                          <Link
                            href={`/characters/${character.id}`}
                            className='flex items-center gap-2 w-full'
                            tabIndex={0}
                          >
                            <Image
                              src={character.imageUrl!}
                              alt={character.id!}
                              className='w-10 h-10'
                              width={40}
                              height={40}
                            />
                            <span className='text-lg dark:text-white truncate'>{character.id}</span>
                          </Link>
                        </li>
                      ))}
                      {allCounters(skill)[1].map((character) => (
                        <li
                          key={character.id ?? ''}
                          className='flex items-center gap-4 p-3 rounded-lg transition-colors bg-red-50 dark:bg-red-900/30 opacity-60 hover:-translate-y-1'
                        >
                          <Link
                            href={`/characters/${character.id}`}
                            className='flex items-center gap-2 w-full opacity-80'
                            tabIndex={0}
                          >
                            <Image
                              src={character.imageUrl!}
                              alt={character.id!}
                              className='w-10 h-10'
                              width={40}
                              height={40}
                            />
                            <span className='text-lg dark:text-white truncate'>{character.id}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/*users*/}
              {allUsers(skill).length != 0 && (
                <div>
                  <span className='font-semibold text-sm text-green-700 dark:text-green-300 flex items-center gap-1'>
                    <span className='w-5 h-5 bg-green-200 rounded-full flex items-center justify-center mr-1'>
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
                  <div className='rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm px-2 py-2'>
                    <ul
                      className={clsx(
                        'grid grid-cols-1 sm:grid-cols-2 gap-4',
                        allUsers(skill).length <= 8 ? 'lg:grid-cols-4' : 'lg:grid-cols-10'
                      )}
                    >
                      {allUsers(skill).map((character) => (
                        <li
                          key={character.id ?? ''}
                          className='flex items-center gap-4 p-3 rounded-lg transition-colors bg-green-50 dark:bg-green-900/30 hover:-translate-y-1'
                        >
                          <Link
                            href={`/characters/${character.id}`}
                            className='flex items-center gap-2 w-full'
                            tabIndex={0}
                          >
                            <Image
                              src={character.imageUrl!}
                              alt={character.id!}
                              className='w-10 h-10'
                              width={40}
                              height={40}
                            />
                            {(isMobile || allUsers(skill).length <= 8) && (
                              <span className='text-lg dark:text-white truncate'>
                                {character.id}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
