'use client';

import { useState } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn } from '@/lib/design';
import type { Skill } from '@/data/types';
import { editable } from '@/components/ui/editable';
import Image from '@/components/Image';
import { characters } from '@/data';

const e = editable('characters');

export default function SkillCardMedia({
  skill,
  characterId,
  skillIndex,
  isEditMode,
}: {
  skill: DeepReadonly<Skill>;
  characterId: string;
  skillIndex: number;
  isEditMode: boolean;
}) {
  const [showVideoAddress, setShowVideoAddress] = useState(false);

  if (!skill.imageUrl) {
    return null;
  }

  return (
    <div className='mr-2 shrink-0 md:mr-6'>
      <div className='relative h-16 w-16 overflow-hidden rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-slate-700'>
        <Image
          src={skill.imageUrl}
          alt={skill.name}
          fill
          sizes='64px'
          className='object-contain p-2'
        />
      </div>
      {isEditMode && (
        <div className='mt-2'>
          <button
            type='button'
            onClick={() => setShowVideoAddress(!showVideoAddress)}
            className={cn(
              'block w-full rounded-md px-2 py-1 text-center text-xs transition-colors',
              skill.videoUrl
                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:underline dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
                : 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900'
            )}
            data-tutorial-id='skill-video-url-edit'
          >
            {showVideoAddress ? '隐藏视频地址' : skill.videoUrl ? '查看视频' : '无视频'}
          </button>
          {showVideoAddress && (
            <e.div
              className='mt-2 block w-full rounded-md bg-blue-50 px-2 py-1 text-center text-xs wrap-anywhere text-blue-600 transition-colors hover:bg-blue-100 hover:underline dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
              path={`skills.${skillIndex}.videoUrl`}
              initialValue={skill.videoUrl ?? '输入视频网址'}
              onSave={(newValue) => {
                const skill = characters[characterId]!.skills[skillIndex]!;
                if (newValue.trim() === '输入视频网址' || newValue.trim() === '') {
                  delete skill.videoUrl;
                } else {
                  skill.videoUrl = newValue.trim();
                }
              }}
            />
          )}
        </div>
      )}

      {!isEditMode && skill.videoUrl && (
        <div className='mt-2'>
          <button
            type='button'
            onClick={() => window.open(skill.videoUrl, '_blank', 'noopener,noreferrer')}
            className='block w-full rounded-md bg-blue-50 px-2 py-1 text-center text-xs text-blue-600 transition-colors hover:bg-blue-100 hover:underline dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
          >
            查看视频
          </button>
        </div>
      )}
    </div>
  );
}
