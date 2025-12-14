import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { useSnapshot } from 'valtio';

import type { DeepReadonly } from '@/types/deep-readonly';
import { useScrollSpy } from '@/hooks/useScrollSpy';
import { useLocalCharacter } from '@/context/EditModeContext';
import type { Skill } from '@/data/types';
import { characters } from '@/data';

function CharacterSectionIndexItem({
  name,
  type = 'Section',
  isActive = false,
}: {
  name: string;
  type?: 'Section' | 'Skill';
  isActive?: boolean;
}) {
  return (
    <li>
      <a
        className={clsx(
          'flex items-center gap-0.5 rounded px-1 py-0.5 text-sm transition-colors hover:underline focus:ring-2 focus:ring-blue-400 focus:outline-none dark:focus:ring-blue-600',
          isActive
            ? 'bg-blue-100 font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
            : 'text-gray-700 dark:text-gray-200'
        )}
        href={`#${type}:${name}`}
        aria-label={name}
      >
        {name}
      </a>
    </li>
  );
}

export default function CharacterSectionIndex() {
  const { characterId } = useLocalCharacter();
  const character = useSnapshot(characters[characterId]!);
  const [skillsOpen, setSkillsOpen] = useState(false);

  // Generate all section IDs for scroll spy
  const sectionIds = useMemo(() => {
    const ids = [
      'Section:推荐加点',
      'Section:推荐知识卡组',
      'Section:技能描述',
      `Section:克制关系`,
    ];

    // Add skill IDs
    character.skills.forEach((skill: DeepReadonly<Skill>) => {
      ids.push(`Skill:${skill.name}`);
    });

    return ids;
  }, [character.skills]);

  const activeSection = useScrollSpy(sectionIds, {
    threshold: 0.3,
    rootMargin: '-10% 0px -50% 0px',
  });

  // Auto-expand skills section if a skill is active
  const isSkillActive = activeSection?.startsWith('Skill:');
  const shouldExpandSkills = skillsOpen || isSkillActive;

  return (
    <nav className='my-4 w-full' aria-label='角色详情索引'>
      <h3 className='mb-3 text-lg font-semibold text-gray-800 dark:text-gray-200'>目录</h3>
      {/* Responsive: allow horizontal scroll on mobile if needed */}
      <ul className='flex flex-col gap-1'>
        <CharacterSectionIndexItem
          name='推荐加点'
          isActive={activeSection === 'Section:推荐加点'}
        />
        <CharacterSectionIndexItem
          name='推荐知识卡组'
          isActive={activeSection === 'Section:推荐知识卡组'}
        />
        <li>
          <button
            type='button'
            aria-label={skillsOpen ? '折叠技能描述' : '展开技能描述'}
            className={clsx(
              'mb-1 flex w-full cursor-pointer items-center justify-between px-1 py-1 text-sm font-bold transition-colors focus:outline-none',
              activeSection === 'Section:技能描述' || isSkillActive
                ? 'text-blue-800 dark:text-blue-200'
                : 'dark:text-white'
            )}
            onClick={() => setSkillsOpen((open) => !open)}
          >
            <span>技能描述</span>
            <svg
              className={clsx(
                'h-4 w-4 transform transition-transform duration-200 ease-out',
                shouldExpandSkills ? 'rotate-0' : '-rotate-90'
              )}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M19 9l-7 7-7-7'
              ></path>
            </svg>
          </button>
          <div
            className={clsx(
              'transition-all ease-out',
              shouldExpandSkills ? 'duration-300' : 'duration-200',
              shouldExpandSkills ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
            )}
            style={{ pointerEvents: shouldExpandSkills ? 'auto' : 'none' }}
            {...(!shouldExpandSkills && { 'aria-hidden': true })}
          >
            <ul className='ml-4 flex flex-col gap-0.5'>
              {character.skills.map((skill: DeepReadonly<Skill>) => (
                <CharacterSectionIndexItem
                  key={skill.id}
                  name={skill.name}
                  type='Skill'
                  isActive={activeSection === `Skill:${skill.name}`}
                />
              ))}
            </ul>
          </div>
        </li>
        <CharacterSectionIndexItem
          name={character.factionId == 'cat' ? '克制关系' : '克制/协作关系'}
          isActive={activeSection === `Section:克制关系`}
        />
      </ul>
    </nav>
  );
}
