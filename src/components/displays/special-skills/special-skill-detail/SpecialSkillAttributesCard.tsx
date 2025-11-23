'use client';

import { SpecialSkill } from '@/data/types';

import { componentTokens, designTokens } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import BaseCard from '@/components/ui/BaseCard';
import GameImage from '@/components/ui/GameImage';
import SpecifyTypeNavigationButtons from '@/components/ui/SpecifyTypeNavigationButtons';

interface SpecialSkillDetailClientProps {
  skill: SpecialSkill;
}

export default function SpecialSkillAttributesCard({ skill }: SpecialSkillDetailClientProps) {
  const isMobile = useMobile();
  const spacing = designTokens.spacing;

  if (!skill) return null;

  return (
    <BaseCard variant='details'>
      {/*------Image ,Name and Type------*/}
      {isMobile && (
        <div>
          <div
            className={`auto-fit-grid grid-container grid`}
            style={{
              gridTemplateColumns: `5rem repeat(auto-fit, minmax(1px,1fr))`,
            }}
          >
            <GameImage
              src={skill.imageUrl}
              alt={skill.name}
              size={'CARD_DETAILS'}
              style={{
                height: isMobile ? '6rem' : undefined,
                borderRadius: componentTokens.image.container.borderRadius.replace(/ .*? /, ' 0 '),
              }}
            />
            <div>
              <h1
                className='text-2xl font-bold dark:text-white'
                style={{
                  paddingTop: spacing.xs,
                }}
              >
                {skill.name}{' '}
              </h1>
              <h1 className='text-lg font-normal text-gray-400 dark:text-gray-500'>
                (特技{skill.factionId === 'cat' ? '·猫' : skill.factionId === 'mouse' ? '·鼠' : ''})
              </h1>
              {skill.aliases !== undefined && (
                <h1
                  className={`text-xs text-gray-400 dark:text-gray-500 ${isMobile ? '' : 'mt-2'}`}
                >
                  别名: {(skill.aliases ?? []).filter(Boolean).join('、')}
                </h1>
              )}
            </div>
          </div>
        </div>
      )}
      {!isMobile && (
        <div
          style={{
            paddingBottom: spacing.xxxxxs,
          }}
        >
          <GameImage src={skill.imageUrl} alt={skill.name} size={'CARD_DETAILS'} />
          <div
            style={{
              paddingLeft: spacing.md,
              paddingRight: spacing.md,
              paddingTop: spacing.xs,
            }}
          >
            <h1 className='text-3xl font-bold dark:text-white'>
              {skill.name}{' '}
              <span className='text-xl font-normal text-gray-400 dark:text-gray-500'>
                (特技{skill.factionId === 'cat' ? '·猫' : skill.factionId === 'mouse' ? '·鼠' : ''})
              </span>
            </h1>
          </div>
          {skill.aliases !== undefined && (
            <div
              className='text-sm text-gray-400 dark:text-gray-500'
              style={{
                marginLeft: spacing.md,
                marginRight: spacing.md,
              }}
            >
              别名: {(skill.aliases ?? []).filter(Boolean).join('、')}
            </div>
          )}
        </div>
      )}

      {/*------Item Attributes------*/}
      <div
        className='grid items-center gap-1 border-t border-gray-300 dark:border-gray-600'
        style={{
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xxxxxs,
          paddingBottom: spacing.xxxxxs,
        }}
      >
        <div className='flex flex-wrap items-center gap-1 text-sm font-normal'>
          <span className={`text-sm whitespace-pre`}>
            {'CD：'}
            <span className='text-indigo-700 dark:text-indigo-400'>{skill.cooldown}</span>
            {' 秒'}
          </span>
        </div>
      </div>

      {/*Navigation */}
      <div
        className='flex flex-wrap items-center border-t border-gray-300 text-sm dark:border-gray-600'
        style={{
          gap: spacing.sm,
          marginLeft: spacing.md,
          marginRight: spacing.md,
          paddingTop: spacing.xs,
          paddingBottom: spacing.md,
        }}
      >
        <SpecifyTypeNavigationButtons
          currentId={skill.name}
          specifyType='specialSkill'
          under={skill.factionId == 'cat' ? false : true}
        />
      </div>
    </BaseCard>
  );
}
