'use client';

import Link from 'next/link';
import Image from 'next/image';
import { specialSkills } from '@/data';
import { useState } from 'react';

const allSkills = [...Object.values(specialSkills.cat), ...Object.values(specialSkills.mouse)];

export default function SpecialSkillClient() {
  const [selectedFaction, setSelectedFaction] = useState<'cat' | 'mouse' | null>(null);

  // Filter skills by faction if selected
  const filteredSkills = selectedFaction
    ? allSkills.filter((skill) => skill.factionId === selectedFaction)
    : allSkills;

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'>
      <header className='text-center space-y-4 mb-8 px-4'>
        <h1 className='text-4xl font-bold text-blue-600 dark:text-blue-400 py-3'>特技</h1>
        <p className='text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 py-2'>
          特殊技能一览，点击技能可查看详细说明与效果。
        </p>
        {/* Faction Filter Controls */}
        <div className='flex justify-center items-center gap-4 mt-8'>
          <span className='text-lg font-medium text-gray-700 dark:text-gray-300 hidden sm:inline'>
            阵营筛选:
          </span>
          <span className='text-lg font-medium text-gray-700 dark:text-gray-300 sm:hidden'>
            筛选:
          </span>
          <div className='flex gap-2'>
            {(['cat', 'mouse'] as const).map((factionName) => {
              const isActive = factionName === selectedFaction;
              return (
                <button
                  type='button'
                  key={factionName}
                  onClick={() => setSelectedFaction(isActive ? null : factionName)}
                  className={`px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm cursor-pointer border-none
                    ${
                      isActive
                        ? factionName === 'cat'
                          ? 'bg-yellow-200 text-yellow-800 dark:bg-yellow-400 dark:text-black'
                          : 'bg-sky-200 text-sky-800 dark:bg-sky-400 dark:text-black'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-gray-300'
                    }`}
                >
                  {factionName === 'cat' ? '猫阵营' : '鼠阵营'}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8'>
        {filteredSkills.map((skill) => (
          <Link
            key={skill.name}
            href={`/special-skills/${encodeURIComponent(skill.factionId)}/${encodeURIComponent(skill.name)}`}
            className='block bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transform transition-all duration-200 hover:-translate-y-1 p-4 border border-gray-200 dark:border-slate-700'
          >
            <div className='flex flex-col items-center'>
              <div className='relative w-16 h-16 mb-2'>
                <Image
                  src={skill.imageUrl}
                  alt={skill.name}
                  fill
                  sizes='64px'
                  className='object-contain'
                />
              </div>
              <div className='text-center'>
                <div className='font-semibold dark:text-white'>{skill.name}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
