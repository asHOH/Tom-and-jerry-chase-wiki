// 'use client';

import Link from 'next/link';
import Image from 'next/image';
import catSpecialSkills from '@/data/catSpecialSkills';
// import mouseSpecialSkills from '@/data/mouseSpecialSkills';

const skills = Object.values(catSpecialSkills); // Add ...Object.values(mouseSpecialSkills) when available

export default function SpecialSkillClient() {
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-bold mb-4'>猫方特殊技能</h1>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
        {skills.map((skill) => (
          <Link
            key={skill.name}
            href={`/special-skills/${encodeURIComponent(skill.name)}`}
            className='block bg-white dark:bg-slate-800 rounded-lg shadow hover:shadow-lg transition p-4 border border-gray-200 dark:border-slate-700'
          >
            <div className='flex flex-col items-center'>
              <div className='relative w-16 h-16 mb-2'>
                <Image
                  src={skill.imageUrl}
                  alt={skill.name}
                  fill
                  sizes='64px'
                  className='object-contain rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600'
                />
              </div>
              <div className='text-center'>
                <div className='font-semibold'>{skill.name}</div>
                {skill.cooldown && (
                  <div className='text-xs text-gray-500 dark:text-gray-400'>
                    CD: {skill.cooldown}s
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
