'use client';

import React from 'react';
import clsx from 'clsx';

import type { DeepReadonly } from '@/types/deep-readonly';
import { getSkillLevelColors, getSkillLevelContainerColor } from '@/lib/design-tokens';
import { useMobile } from '@/hooks/useMediaQuery';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { Skill, SkillLevel } from '@/data/types';
import TextWithHoverTooltips from '@/features/characters/components/shared/TextWithHoverTooltips';
import TextWithItemKeyTooltips from '@/features/characters/components/shared/TextWithItemKeyTooltips';
import {
  convertCancelableAftercastToDisplayText,
  convertCancelableSkillToDisplayText,
} from '@/features/characters/utils/skills';
import Image from '@/components/Image';

interface SkillCardProps {
  skill: DeepReadonly<Skill & { cooldown?: number }>;
  skillIndex: number;
}

function SkillDescriptionPrefix({
  skill,
  level,
}: {
  skill: DeepReadonly<Skill & { cooldown?: number }>;
  level: number;
}) {
  if (level == 1) return null;
  const previousCooldown = skill.skillLevels[level - 2]?.cooldown ?? 0;
  const cooldown = skill.skillLevels[level - 1]?.cooldown ?? 0;
  if (previousCooldown != cooldown) {
    return `CD减少至${cooldown}秒${skill.skillLevels[level - 1]?.description ? '；' : '。'}`;
  }
  return null;
}

export default function EntitySkillCard({ skill }: SkillCardProps) {
  const { isDetailedView: isDetailed } = useAppContext();
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const getSkillTypeLabel = (type: string) => {
    const typeMap = {
      active: '主动技能',
      weapon1: '武器技能',
      weapon2: '道具键技能',
      passive: '额外技能',
    };
    return typeMap[type as keyof typeof typeMap] || '额外技能';
  };

  const getCooldownProperty = () => {
    if (!skill.skillLevels.some((level: SkillLevel) => level.cooldown))
      return skill.cooldown ? `CD: ${skill.cooldown} 秒` : null;

    const cooldowns = skill.skillLevels.map((level: SkillLevel) => level.cooldown || '-');
    const uniqueCooldowns = Array.from(new Set(cooldowns));

    if (uniqueCooldowns.length === 1 && uniqueCooldowns[0] !== '-') {
      return `CD: ${uniqueCooldowns[0]} 秒`;
    }

    return [
      'CD: ',
      cooldowns.map((i, index) => (
        <React.Fragment key={index}>
          {index != 0 ? '/' : ''}
          <TextWithHoverTooltips text={i as string} />
        </React.Fragment>
      )),
      ' 秒',
    ];
  };

  const getSkillProperties = () => {
    const properties: React.ReactNode[] = [];

    const cooldownProp = getCooldownProperty();
    if (cooldownProp) properties.push(cooldownProp);
    {
      if (skill.canMoveWhileUsing) properties.push('移动释放');
      if (skill.canUseInAir) properties.push('空中释放');
      if (skill.type !== 'passive') {
        // Combine forecast with cancelableSkill (optional fields)
        const forecastBase =
          typeof skill.forecast === 'number'
            ? skill.forecast < 0
              ? '前摇未测试'
              : skill.forecast === 0
                ? '无前摇'
                : `前摇 ${skill.forecast} 秒`
            : undefined;
        const cancelableSkillText =
          skill.forecast !== 0 && skill.cancelableSkill
            ? typeof skill.cancelableSkill === 'string'
              ? skill.cancelableSkill
              : convertCancelableSkillToDisplayText(skill.cancelableSkill)
            : undefined;
        if (forecastBase || cancelableSkillText) {
          const text = `${forecastBase ?? ''}${forecastBase && cancelableSkillText ? '，' : ''}${
            cancelableSkillText ?? ''
          }`;
          properties.push(
            <TextWithItemKeyTooltips key='forecast' text={text} isDetailed={isDetailed} />
          );
        }

        // Combine aftercast with cancelableAftercast (optional fields)
        const aftercastBase =
          typeof skill.aftercast === 'number'
            ? skill.aftercast < 0
              ? '后摇未测试'
              : skill.aftercast === 0
                ? '无后摇'
                : `后摇 ${skill.aftercast} 秒`
            : undefined;
        const cancelableAfterText =
          skill.aftercast !== 0 && skill.cancelableAftercast
            ? typeof skill.cancelableAftercast === 'string'
              ? skill.cancelableAftercast
              : convertCancelableAftercastToDisplayText(skill.cancelableAftercast)
            : undefined;
        if (aftercastBase || cancelableAfterText) {
          const text = `${aftercastBase ?? ''}${aftercastBase && cancelableAfterText ? '，' : ''}${
            cancelableAfterText ?? ''
          }`;
          properties.push(
            <TextWithItemKeyTooltips key='aftercast' text={text} isDetailed={isDetailed} />
          );
        }
      }

      if (skill.canHitInPipe) properties.push('可击中管道中的角色');
      if (skill.cooldownTiming && skill.cooldownTiming !== '释放时') {
        properties.push(`CD时机: ${skill.cooldownTiming}`);
      }
      if (skill.cueRange && skill.cueRange !== '无音效') {
        properties.push(`技能音效: ${skill.cueRange}`);
      }
    }

    return properties;
  };

  const properties = getSkillProperties();
  const hasProperties = properties.length > 0;

  return (
    <div className='card p-6! dark:border-slate-700 dark:bg-slate-800'>
      <div className='flex items-start justify-between'>
        {skill.imageUrl && (
          <div className='mr-6 flex-shrink-0'>
            <div className='relative h-16 w-16 overflow-hidden rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-slate-700'>
              <Image
                src={skill.imageUrl}
                alt={skill.name}
                fill
                sizes='64px'
                className='object-contain p-2'
              />
            </div>

            {skill.videoUrl && (
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
        )}

        <div className='flex-1'>
          <div className='flex items-center justify-between'>
            <h3 className='px-2 py-2 text-xl font-bold dark:text-white'>
              {getSkillTypeLabel(skill.type)} · {skill.name}
            </h3>
          </div>

          {hasProperties && (
            <div className='mt-1 px-2 text-sm text-gray-500 dark:text-gray-400'>
              {properties.map((prop, index) => (
                <React.Fragment key={index}>
                  {index > 0 && ' · '}
                  {prop}
                </React.Fragment>
              ))}
            </div>
          )}

          {'description' in skill && (
            <div className='mt-3 px-2'>
              <div className='py-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
                <TextWithHoverTooltips
                  text={
                    (isDetailed && skill.detailedDescription?.trim()
                      ? skill.detailedDescription
                      : skill.description) ?? '<无内容>'
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className='mt-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {skill.skillLevels
            .filter((level: SkillLevel) => {
              // Hide Lv.1 if: 1) mobile layout, 2) edit mode off, 3) description is empty for current detailed mode
              if (level.level === 1 && isMobile) {
                const levelDescription =
                  isDetailed && level.detailedDescription?.trim()
                    ? level.detailedDescription
                    : level.description;
                return levelDescription?.trim() !== '';
              }
              return true;
            })
            .map((level: SkillLevel) => (
              <div
                key={`${skill.id}-${level.level}`}
                className={clsx(
                  'rounded p-4 dark:text-gray-300',
                  getSkillLevelContainerColor(level.level, isDarkMode)
                )}
              >
                <p className='px-2 py-1 whitespace-pre-wrap'>
                  <span
                    className='font-bold'
                    style={{ color: getSkillLevelColors(level.level, false, isDarkMode).color }}
                  >
                    Lv.{level.level}:
                  </span>{' '}
                  <SkillDescriptionPrefix skill={skill} level={level.level} />
                  <TextWithHoverTooltips
                    text={
                      isDetailed && level.detailedDescription?.trim()
                        ? level.detailedDescription
                        : level.description
                    }
                  />
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
