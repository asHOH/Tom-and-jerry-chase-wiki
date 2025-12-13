'use client';

import { SpecialSkill } from '@/data/types';

import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillAttributesCard({ skill }: SpecialSkillDetailClientProps) {
  const isMobile = useMobile();

  if (!skill) return null;

  return (
    <BaseCard variant='details'>
      {/*------Image ,Name and Type------*/}
      {isMobile && (
        <div>
          <div
            className='auto-fit-grid grid-container grid'
            style={{ gridTemplateColumns: '5rem repeat(auto-fit, minmax(1px,1fr))' }}
          >
            <GameImage
              src={skill.imageUrl}
              alt={skill.name}
              size={'CARD_DETAILS'}
              className='h-24 rounded-tl-lg'
            />
            <div>
              <h1 className='pt-2 text-2xl font-bold dark:text-white'>{skill.name} </h1>
              <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                (特技{skill.factionId === 'cat' ? '·猫' : skill.factionId === 'mouse' ? '·鼠' : ''})
              </h1>
              {skill.aliases !== undefined && (
                <h1 className='text-xs text-gray-400 dark:text-gray-500'>
                  别名: {(skill.aliases ?? []).filter(Boolean).join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <div className='pb-1'>
          <GameImage src={skill.imageUrl} alt={skill.name} size={'CARD_DETAILS'} />
          <div className='px-4 pt-2'>
            <h1 className='text-3xl font-bold dark:text-white'>
              {skill.name}{' '}
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                (特技{skill.factionId === 'cat' ? '·猫' : skill.factionId === 'mouse' ? '·鼠' : ''})
              </span>
            </h1>
          </div>
          {skill.aliases !== undefined && (
            <div className='mx-4 text-sm text-gray-400 dark:text-gray-500'>
              别名: {(skill.aliases ?? []).filter(Boolean).join('、')}
            </div>
          )}
        </div>
      )}

      {/*------Item Attributes------*/}
      <div className='mx-4 grid items-center gap-1 border-t border-gray-300 py-1 dark:border-gray-600'>
        <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
          <span className='text-sm whitespace-pre'>
            {'CD：'}
            <span className='text-indigo-700 dark:text-indigo-400'>{skill.cooldown}</span>
            {' 秒'}
          </span>
        </div>
      </div>

      {/*Navigation */}
      <div className='mx-4 flex flex-wrap items-center gap-3 border-t border-gray-300 pt-2 pb-4 text-sm dark:border-gray-600'>
        <SpecifyTypeNavigationButtons
          currentId={skill.name}
          specifyType='specialSkill'
          under={skill.factionId == 'cat' ? false : true}
        />
      </div>
    </BaseCard>
  );
}
