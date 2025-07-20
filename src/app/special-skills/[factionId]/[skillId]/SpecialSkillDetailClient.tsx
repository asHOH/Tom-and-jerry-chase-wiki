'use client';

import { useAppContext } from '@/context/AppContext';
import Image from 'next/image';

interface SpecialSkillDetailClientProps {
  skill: {
    name: string;
    imageUrl: string;
    cooldown?: number;
    aliases?: string[] | string;
    description?: string;
    detailedDescription?: string;
  };
}

export default function SpecialSkillDetailClient({ skill }: SpecialSkillDetailClientProps) {
  const { isDetailedView } = useAppContext();

  if (!skill) return null;

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <div className='flex items-center gap-6 mb-6'>
        <div className='relative w-20 h-20'>
          <Image
            src={skill.imageUrl}
            alt={skill.name}
            fill
            sizes='80px'
            className='object-contain rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600'
          />
        </div>
        <div>
          <h1 className='text-3xl font-bold mb-2 dark:text-slate-100'>{skill.name}</h1>
          {skill.cooldown && (
            <div className='text-gray-500 dark:text-gray-400 mb-1'>CD: {skill.cooldown}s</div>
          )}
          {skill.aliases && (
            <div className='text-xs text-gray-400 mb-1'>
              别名: {Array.isArray(skill.aliases) ? skill.aliases.join('、') : skill.aliases}
            </div>
          )}
        </div>
      </div>
      <div className='prose prose-slate dark:prose-invert dark:prose-slate dark:text-slate-100'>
        <p>
          {isDetailedView && skill.detailedDescription
            ? skill.detailedDescription
            : skill.description}
        </p>
      </div>
    </div>
  );
}
