import React from 'react';
import Image from 'next/image';
import { getSkillLevelColors, getSkillLevelContainerColor } from '@/lib/design-tokens';
import { TextWithItemKeyTooltips } from '../shared';
import { Skill, SkillLevel } from '@/data/types';

interface SkillCardProps {
  skill: Skill;
  isDetailed: boolean;
  isSingleWeapon?: boolean;
}

export default function SkillCard({ skill, isDetailed, isSingleWeapon }: SkillCardProps) {
  const getSkillTypeLabel = (type: string) => {
    if (isSingleWeapon && type === 'weapon1') {
      return '武器';
    }
    const typeMap = {
      active: '主动',
      weapon1: '武器1',
      weapon2: '武器2',
      passive: '被动',
    };
    return typeMap[type as keyof typeof typeMap] || '被动';
  };

  const getSkillProperties = () => {
    const properties: (string | React.ReactElement)[] = [];

    if (skill.skillLevels.some((level: SkillLevel) => level.cooldown)) {
      const cooldowns = skill.skillLevels.map((level: SkillLevel) => level.cooldown || '-');
      const uniqueCooldowns = Array.from(new Set(cooldowns));

      if (uniqueCooldowns.length === 1 && uniqueCooldowns[0] !== '-') {
        properties.push(`CD: ${uniqueCooldowns[0]} 秒`);
      } else {
        properties.push(`CD: ${cooldowns.join(' / ')} 秒`);
      }
    }

    if (skill.canMoveWhileUsing) properties.push('移动释放');
    if (skill.canUseInAir) properties.push('空中释放');
    if (skill.cancelableSkill) {
      properties.push(
        <TextWithItemKeyTooltips
          key='cancelableSkill'
          text={skill.cancelableSkill}
          isDetailed={isDetailed}
        />
      );
    }
    if (skill.cancelableAftercast) {
      properties.push(
        <TextWithItemKeyTooltips
          key='cancelableAftercast'
          text={skill.cancelableAftercast}
          isDetailed={isDetailed}
        />
      );
    }

    return properties;
  };

  const descriptionText =
    isDetailed && skill.detailedDescription?.trim() ? skill.detailedDescription : skill.description;

  const properties = getSkillProperties();
  const hasProperties = properties.length > 0;

  return (
    <div className='card p-6'>
      <div className='flex justify-between items-start'>
        {skill.imageUrl && (
          <div className='flex-shrink-0 mr-6'>
            <div className='relative w-16 h-16 rounded-full border-2 overflow-hidden border-gray-300 bg-white'>
              <Image
                src={skill.imageUrl}
                alt={skill.name}
                fill
                sizes='64px'
                className='object-cover scale-75'
              />
            </div>

            {skill.videoUrl && (
              <div className='mt-2'>
                <button
                  onClick={() => window.open(skill.videoUrl, '_blank', 'noopener,noreferrer')}
                  className='text-blue-600 text-xs px-2 py-1 hover:underline bg-blue-50 rounded-md hover:bg-blue-100 transition-colors block w-full text-center'
                >
                  查看视频
                </button>
              </div>
            )}
          </div>
        )}

        <div className='flex-1'>
          <h3 className='text-xl font-bold px-2 py-2'>
            {getSkillTypeLabel(skill.type)} · {skill.name}
          </h3>

          {hasProperties && (
            <div className='text-sm text-gray-500 mt-1 px-2'>
              {properties.map((prop, index) => (
                <React.Fragment key={index}>
                  {index > 0 && ' · '}
                  {prop}
                </React.Fragment>
              ))}
            </div>
          )}

          {descriptionText && (
            <div className='mt-3 px-2'>
              <p className='text-gray-700 py-2'>{descriptionText}</p>
            </div>
          )}
        </div>
      </div>

      <div className='mt-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {skill.skillLevels.map((level: SkillLevel) => (
            <div
              key={`${skill.id}-${level.level}`}
              className={`p-4 rounded ${getSkillLevelContainerColor(level.level)}`}
            >
              <p className='px-2 py-1'>
                <span
                  className='font-bold'
                  style={{ color: getSkillLevelColors(level.level).color }}
                >
                  Lv. {level.level}:
                </span>{' '}
                {isDetailed && level.detailedDescription?.trim()
                  ? level.detailedDescription
                  : level.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
