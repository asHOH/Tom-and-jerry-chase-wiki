'use client';

import React, { useState, Fragment } from 'react';
import Image from '@/components/Image';
import { getSkillLevelColors, getSkillLevelContainerColor } from '@/lib/design-tokens';
import TextWithItemKeyTooltips from '../shared/TextWithItemKeyTooltips';
import { Skill, SkillLevel } from '@/data/types';
import EditableField from '@/components/ui/EditableField';
import { useEditMode } from '@/context/EditModeContext';
import { useSnapshot } from 'valtio';
import { useAppContext } from '@/context/AppContext';
import { characters } from '@/data';
import { CharacterWithFaction } from '@/lib/types';
import {
  convertCancelableAftercastToDisplayText,
  convertCancelableSkillToDisplayText,
} from '@/lib/skillUtils';
import { AssetManager } from '@/lib/assetManager';
import type { DeepReadonly } from '@/types/deep-readonly';
import { useDarkMode } from '@/context/DarkModeContext';
import { useMobile } from '@/hooks/useMediaQuery';
import clsx from 'clsx';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import SkillTraitsCard from './SkillTraitsCard';

interface SkillCardProps {
  skill: DeepReadonly<Skill>;
  isSingleWeapon?: boolean;
  characterId: string;
  skillIndex: number;
}

function SkillDescriptionPrefix({ skill, level }: { skill: DeepReadonly<Skill>; level: number }) {
  const results: string[] = [];
  const previousCharges = skill.skillLevels[level - 2]?.charges ?? 1;
  const charges = skill.skillLevels[level - 1]?.charges ?? 1;
  if (previousCharges != charges) {
    if (charges != 1) {
      results.push(`技能可以存储${charges}次`);
    }
  }
  const previousCooldown = skill.skillLevels[level - 2]?.cooldown ?? 0;
  const cooldown = skill.skillLevels[level - 1]?.cooldown ?? 0;
  if (previousCooldown != cooldown && level != 1) {
    results.push(`CD减少至${cooldown}秒`);
  }
  return (
    results.join('；') +
    (results.length ? (skill.skillLevels[level - 1]?.description ? '；' : '。') : '')
  );
}

export default function SkillCard({
  skill,
  isSingleWeapon,
  characterId,
  skillIndex,
}: SkillCardProps) {
  const { isEditMode } = useEditMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const localCharacter = useSnapshot(characters[characterId]!) as CharacterWithFaction;
  const [showVideoAddress, setShowVideoAddress] = useState(false);
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

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

  const getCooldownProperty = () => {
    if (!skill.skillLevels.some((level: SkillLevel) => level.cooldown)) return null;

    const cooldowns = skill.skillLevels.map((level: SkillLevel) => level.cooldown || '-');
    const uniqueCooldowns = Array.from(new Set(cooldowns));

    if (uniqueCooldowns.length === 1 && uniqueCooldowns[0] !== '-' && !isEditMode) {
      return `CD: ${uniqueCooldowns[0]} 秒`;
    }

    return [
      'CD: ',
      cooldowns.map((i, index) => (
        <React.Fragment key={index}>
          {index != 0 ? '/' : ''}
          <EditableField
            tag='span'
            path={`skills.${skillIndex}.skillLevels.${index}.cooldown`}
            initialValue={i}
          />
        </React.Fragment>
      )),
      ' 秒',
    ];
  };

  const getChargesProperty = () => {
    if (skill.type == 'passive') return null;

    const charges = skill.skillLevels.map((level: SkillLevel) => level.charges || 1);
    const uniqueCharges = Array.from(new Set(charges));
    if (uniqueCharges.length === 1 && !isEditMode) {
      if (uniqueCharges[0] === 1) return null;
      return `技能存储次数: ${uniqueCharges[0]}`;
    }

    return [
      '技能存储次数: ',
      charges.map((i, index) => (
        <React.Fragment key={index}>
          {index != 0 ? '/' : ''}
          <EditableField
            tag='span'
            path={`skills.${skillIndex}.skillLevels.${index}.charges`}
            initialValue={i}
          />
        </React.Fragment>
      )),
    ];
  };

  const createBooleanCheckbox = (
    label: string,
    property: 'canMoveWhileUsing' | 'canUseInAir' | 'canHitInPipe' | 'causesWoundedState',
    trueText: string,
    falseText: string
  ) => {
    const skillRef = characters[characterId]!.skills[skillIndex]!;

    return (
      <div className='flex items-center gap-1 text-xs'>
        <span className='text-xs text-gray-400 dark:text-gray-500'>{label}:</span>
        <label className='flex items-center gap-1 cursor-pointer'>
          <input
            type='checkbox'
            checked={skill[property] ?? false}
            onChange={(e) => {
              skillRef[property] = e.target.checked;
            }}
            className='w-3 h-3'
          />
          <span className='font-bold'>{skill[property] ? trueText : falseText}</span>
        </label>
      </div>
    );
  };

  const createRadioGroup = <T extends string>(
    label: string,
    property: 'cooldownTiming' | 'cueRange',
    options: readonly T[],
    defaultValue: T
  ) => {
    const skillRef = characters[characterId]!.skills[skillIndex]!;
    const currentValue = (skill[property] as T) ?? defaultValue;

    return (
      <div className='flex items-center gap-1 text-xs'>
        <span className='text-xs text-gray-400 dark:text-gray-500'>{label}:</span>
        <div className='flex flex-wrap gap-1'>
          {options.map((option) => (
            <label key={option} className='flex items-center gap-1 cursor-pointer'>
              <input
                type='radio'
                name={`${property}-${skillIndex}`}
                checked={currentValue === option}
                onChange={() => {
                  (skillRef[property] as T) = option;
                }}
                className='w-3 h-3'
              />
              <span className={clsx({ 'font-bold': currentValue === option })}>{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const getSkillProperties = () => {
    const properties: React.ReactNode[] = [];

    const cooldownProp = getCooldownProperty();
    if (cooldownProp) properties.push(cooldownProp);

    const chargesProp = getChargesProperty();
    if (chargesProp) properties.push(chargesProp);

    if (isEditMode && skill.type !== 'passive') {
      properties.push(
        <div className='text-xs text-gray-400 dark:text-gray-500 flex'>
          别名：
          {skill.aliases &&
            skill.aliases.map((alias, index) => (
              <Fragment key={alias}>
                <EditableField
                  tag='span'
                  initialValue={alias}
                  path={`skills.${skillIndex}.aliases.${index}`}
                  onSave={(newValue) => {
                    const skill = characters[characterId]!.skills[skillIndex]!;
                    if (newValue.trim() === '') {
                      // Remove empty alias
                      skill.aliases = skill.aliases!.filter((_, i) => i !== index);
                    } else {
                      // Update alias
                      skill.aliases![index] = newValue.trim();
                    }
                  }}
                />
                {index < skill.aliases!.length - 1 && <span className='text-gray-400'>、</span>}
              </Fragment>
            ))}
          <button
            type='button'
            aria-label='添加别名'
            onClick={() => {
              const skill = characters[characterId]!.skills[skillIndex]!;
              if (!skill.aliases) {
                skill.aliases = [];
              }
              if (skill.aliases.indexOf('新别名') === -1) {
                skill.aliases.push('新别名');
              }
            }}
            className='w-4 h-4 flex items-center justify-center bg-yellow-500 text-white rounded-md text-xs hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700 ml-2'
            key='new-weapon-button'
          >
            <PlusIcon className='w-3 h-3' aria-hidden='true' />
          </button>
        </div>
      );
    }
    if (isEditMode && skill.type != 'passive') {
      properties.push(
        createBooleanCheckbox('移动释放', 'canMoveWhileUsing', '可移动释放', '不可移动释放'),
        createBooleanCheckbox('空中释放', 'canUseInAir', '可空中释放', '不可空中释放'),
        createBooleanCheckbox(
          '造成受伤状态',
          'causesWoundedState',
          '可造成受伤状态',
          '不可造成受伤状态'
        ),
        <div className='flex flex-wrap gap-1 items-center'>
          {(() => {
            const specialOptions = ['不可主动打断'] as const;
            const cancelableOptions = [
              '道具键',
              '道具键*',
              '跳跃键',
              '移动键',
              '药水键',
              '本技能键',
              '其他技能键',
            ] as const;

            const activeCancelableOptions = Array.isArray(skill.cancelableSkill)
              ? skill.cancelableSkill
              : [];

            const displayText = () => {
              return convertCancelableSkillToDisplayText(skill.cancelableSkill);
            };

            return (
              <div className='space-y-1'>
                <div className='text-xs'>{displayText()}</div>
                <div className='flex items-center gap-2 text-xs'>
                  <div className='flex items-center gap-1'>
                    <span className='text-xs text-gray-400 dark:text-gray-500'>前摇:</span>
                    <EditableField
                      tag='span'
                      path={`skills.${skillIndex}.forecast`}
                      initialValue={skill.forecast ?? ''}
                      onSave={(val) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        const n = parseFloat(String(val).trim());
                        s.forecast = Number.isFinite(n) ? n : -1;
                        if (s.forecast !== 0 && s.cancelableSkill === '无前摇') {
                          delete s.cancelableSkill;
                        }
                      }}
                    />
                    <span className='text-xs text-gray-400 dark:text-gray-500'>秒</span>
                  </div>
                  <label className='flex items-center gap-1 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={skill.forecast === 0}
                      onChange={(e) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        s.forecast = e.target.checked ? 0 : -1;
                        if (e.target.checked) {
                          s.cancelableSkill = '无前摇';
                        } else if (s.cancelableSkill === '无前摇') {
                          delete s.cancelableSkill;
                        }
                      }}
                      className='w-3 h-3'
                    />
                    <span className={clsx({ 'font-bold': skill.forecast === 0 })}>无前摇</span>
                  </label>
                </div>
                {(() => {
                  const disabled = skill.forecast === 0;
                  return (
                    <>
                      <div
                        className={clsx('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}
                      >
                        {specialOptions.map((option) => (
                          <label key={option} className='flex items-center gap-1 cursor-pointer'>
                            <input
                              type='checkbox'
                              disabled={disabled}
                              checked={skill.cancelableSkill == option}
                              onChange={(e) => {
                                const skill = characters[characterId]!.skills[skillIndex]!;
                                if (e.target.checked) {
                                  skill.cancelableSkill = option;
                                } else {
                                  delete skill.cancelableSkill;
                                }
                              }}
                              className='w-3 h-3'
                            />
                            <span
                              className={clsx(skill.cancelableSkill == option ? 'font-bold' : '')}
                            >
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div
                        className={clsx('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}
                      >
                        <span className='text-xs text-gray-400 dark:text-gray-500'>可被</span>
                        {cancelableOptions.map((option) => (
                          <label key={option} className='flex items-center gap-1 cursor-pointer'>
                            <input
                              type='checkbox'
                              disabled={disabled}
                              checked={activeCancelableOptions.includes(option)}
                              onChange={(e) => {
                                const skill = characters[characterId]!.skills[skillIndex]!;
                                if (e.target.checked) {
                                  if (!Array.isArray(skill.cancelableSkill)) {
                                    skill.cancelableSkill = [];
                                  }
                                  if (!activeCancelableOptions.includes(option)) {
                                    skill.cancelableSkill.push(option);
                                  }
                                  // Mutual exclusion for 道具键 and 道具键*
                                  if (
                                    option === '道具键' &&
                                    skill.cancelableSkill.includes('道具键*')
                                  ) {
                                    const index = skill.cancelableSkill.indexOf('道具键*');
                                    skill.cancelableSkill.splice(index, 1);
                                  } else if (
                                    option === '道具键*' &&
                                    skill.cancelableSkill.includes('道具键')
                                  ) {
                                    const index = skill.cancelableSkill.indexOf('道具键');
                                    skill.cancelableSkill.splice(index, 1);
                                  }
                                } else {
                                  if (!Array.isArray(skill.cancelableSkill)) {
                                    return;
                                  }
                                  const index = activeCancelableOptions.indexOf(option);
                                  if (index > -1) {
                                    skill.cancelableSkill.splice(index, 1);
                                  }
                                }
                              }}
                              className='w-3 h-3'
                            />
                            <span
                              className={clsx({
                                'font-bold': activeCancelableOptions.includes(option),
                              })}
                            >
                              {option}
                            </span>
                          </label>
                        ))}
                        <span className='text-xs text-gray-400 dark:text-gray-500'>打断</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })()}
        </div>,
        <div className='flex flex-wrap gap-1 items-center'>
          {(() => {
            const specialOptions = ['不可取消'] as const;
            const cancelableOptions = [
              '道具键',
              '道具键*',
              '跳跃键',
              '移动键',
              '药水键',
              '本技能键',
              '其他技能键',
            ] as const;

            const activeCancelableOptions = Array.isArray(skill.cancelableAftercast)
              ? skill.cancelableAftercast
              : [];

            const displayText = () => {
              return convertCancelableAftercastToDisplayText(skill.cancelableAftercast);
            };

            return (
              <div className='space-y-1'>
                <div className='text-xs'>{displayText()}</div>
                <div className='flex items-center gap-2 text-xs'>
                  <div className='flex items-center gap-1'>
                    <span className='text-xs text-gray-400 dark:text-gray-500'>后摇:</span>
                    <EditableField
                      tag='span'
                      path={`skills.${skillIndex}.aftercast`}
                      initialValue={skill.aftercast ?? ''}
                      onSave={(val) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        const n = parseFloat(String(val).trim());
                        s.aftercast = Number.isFinite(n) ? n : -1;
                        if (s.aftercast !== 0 && s.cancelableAftercast === '无后摇') {
                          delete s.cancelableAftercast;
                        }
                      }}
                    />
                    <span className='text-xs text-gray-400 dark:text-gray-500'>秒</span>
                  </div>
                  <label className='flex items-center gap-1 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={skill.aftercast === 0}
                      onChange={(e) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        s.aftercast = e.target.checked ? 0 : -1;
                        if (e.target.checked) {
                          s.cancelableAftercast = '无后摇';
                        } else if (s.cancelableAftercast === '无后摇') {
                          delete s.cancelableAftercast;
                        }
                      }}
                      className='w-3 h-3'
                    />
                    <span className={clsx({ 'font-bold': skill.aftercast === 0 })}>无后摇</span>
                  </label>
                </div>
                {(() => {
                  const disabled = skill.aftercast === 0;
                  return (
                    <>
                      <div
                        className={clsx('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}
                      >
                        {specialOptions.map((option) => (
                          <label key={option} className='flex items-center gap-1 cursor-pointer'>
                            <input
                              type='checkbox'
                              disabled={disabled}
                              checked={skill.cancelableAftercast == option}
                              onChange={(e) => {
                                const skill = characters[characterId]!.skills[skillIndex]!;
                                if (e.target.checked) {
                                  skill.cancelableAftercast = option;
                                } else {
                                  delete skill.cancelableAftercast;
                                }
                              }}
                              className='w-3 h-3'
                            />
                            <span
                              className={clsx({ 'font-bold': skill.cancelableAftercast == option })}
                            >
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div
                        className={clsx('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}
                      >
                        <span className='text-xs text-gray-400 dark:text-gray-500'>可被</span>
                        {cancelableOptions.map((option) => (
                          <label key={option} className='flex items-center gap-1 cursor-pointer'>
                            <input
                              type='checkbox'
                              disabled={disabled}
                              checked={activeCancelableOptions.includes(option)}
                              onChange={(e) => {
                                const skill = characters[characterId]!.skills[skillIndex]!;
                                if (e.target.checked) {
                                  // If currently a string (special option), convert to array and add new option
                                  if (typeof skill.cancelableAftercast === 'string') {
                                    skill.cancelableAftercast = [option];
                                  } else if (Array.isArray(skill.cancelableAftercast)) {
                                    // If already an array, add if not present
                                    if (!skill.cancelableAftercast.includes(option)) {
                                      skill.cancelableAftercast.push(option);
                                    }
                                  } else {
                                    // If undefined, initialize as array with new option
                                    skill.cancelableAftercast = [option];
                                  }
                                  // Mutual exclusion for 道具键 and 道具键*
                                  if (Array.isArray(skill.cancelableAftercast)) {
                                    if (
                                      option === '道具键' &&
                                      skill.cancelableAftercast.includes('道具键*')
                                    ) {
                                      const index = skill.cancelableAftercast.indexOf('道具键*');
                                      skill.cancelableAftercast.splice(index, 1);
                                    } else if (
                                      option === '道具键*' &&
                                      skill.cancelableAftercast.includes('道具键')
                                    ) {
                                      const index = skill.cancelableAftercast.indexOf('道具键');
                                      skill.cancelableAftercast.splice(index, 1);
                                    }
                                  }
                                } else {
                                  // If unchecking
                                  if (Array.isArray(skill.cancelableAftercast)) {
                                    // Remove option from array
                                    const index = skill.cancelableAftercast.indexOf(option);
                                    if (index > -1) {
                                      skill.cancelableAftercast.splice(index, 1);
                                    }
                                    // If array becomes empty, delete the property
                                    if (skill.cancelableAftercast.length === 0) {
                                      delete skill.cancelableAftercast;
                                    }
                                  } else if (typeof skill.cancelableAftercast === 'string') {
                                    // If it was a special string and now unchecked, delete it
                                    delete skill.cancelableAftercast;
                                  }
                                  // If it was already undefined, do nothing
                                }
                              }}
                              className='w-3 h-3'
                            />
                            <span
                              className={clsx({
                                'font-bold': activeCancelableOptions.includes(option),
                              })}
                            >
                              {option}
                            </span>
                          </label>
                        ))}
                        <span className='text-xs text-gray-400 dark:text-gray-500'>取消后摇</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })()}
        </div>,
        createBooleanCheckbox(
          '管道攻击',
          'canHitInPipe',
          '可击中管道中的角色',
          '不可击中管道中的角色'
        ),
        createRadioGroup(
          'CD时机',
          'cooldownTiming',
          ['前摇前', '释放时', '释放后'] as const,
          '释放时'
        ),
        createRadioGroup(
          '技能音效',
          'cueRange',
          ['全图可见', '本房间可见', '无音效'] as const,
          '无音效'
        )
      );
    } else {
      if (skill.canMoveWhileUsing) properties.push('移动释放');
      if (skill.canUseInAir) properties.push('空中释放');
      if (skill.causesWoundedState) properties.push('可造成受伤状态');
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
    <div
      className={`card ${isMobile ? 'px-4! py-6!' : 'p-6!'} dark:bg-slate-800 dark:border-slate-700`}
    >
      <div className='flex items-start'>
        {skill.imageUrl && (
          <div className={`flex-shrink-0 ${isMobile ? 'mr-2' : 'mr-6'}`}>
            <div className='relative w-16 h-16 rounded-full border-2 overflow-hidden border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700'>
              <Image
                src={skill.imageUrl}
                alt={skill.name}
                fill
                sizes='64px'
                className='object-contain'
                style={{ padding: '8px' }}
              />
            </div>
            {isEditMode && (
              <div className='mt-2'>
                <button
                  type='button'
                  onClick={() => setShowVideoAddress(!showVideoAddress)}
                  className={clsx(
                    'text-xs px-2 py-1 rounded-md block w-full text-center transition-colors',
                    skill.videoUrl
                      ? 'text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
                      : 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900'
                  )}
                  data-tutorial-id='skill-video-url-edit'
                >
                  {showVideoAddress ? '隐藏视频地址' : skill.videoUrl ? '查看视频' : '无视频'}
                </button>
                {showVideoAddress && (
                  <EditableField
                    tag='div'
                    className='text-blue-600 dark:text-blue-300 text-xs px-2 py-1 hover:underline bg-blue-50 dark:bg-blue-900/50 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors block w-full text-center wrap-anywhere mt-2'
                    path={`skills.${skillIndex}.videoUrl`}
                    initialValue={skill.videoUrl ?? '输入视频网址'}
                    onSave={(newValue) => {
                      const skill = characters[characterId]!.skills[skillIndex]!;
                      // Don't save if the value is the default placeholder text
                      if (newValue.trim() === '输入视频网址' || newValue.trim() === '') {
                        // Clear the video URL
                        delete skill.videoUrl;
                      } else {
                        // Save the actual URL
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
                  className='text-blue-600 dark:text-blue-300 text-xs px-2 py-1 hover:underline bg-blue-50 dark:bg-blue-900/50 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors block w-full text-center'
                >
                  查看视频
                </button>
              </div>
            )}
          </div>
        )}
        {/*电脑版*/}
        {!isMobile && (
          <div className='flex-1'>
            <div className='flex justify-between items-center'>
              <h3 className='text-xl font-bold px-2 py-2 dark:text-white'>
                {getSkillTypeLabel(skill.type)} ·{' '}
                <EditableField
                  tag='span'
                  id={`Skill:${skill.name}`}
                  path={`skills.${skillIndex}.name`}
                  initialValue={skill.name}
                  onSave={(newName) => {
                    // Update skill with new name and regenerate image URL
                    const factionId = localCharacter.factionId!;

                    const skill = characters[characterId]!.skills[skillIndex]!;
                    skill.name = newName;
                    skill.imageUrl = AssetManager.getSkillImageUrl(
                      localCharacter?.id,
                      { ...skill, name: newName },
                      factionId
                    );
                  }}
                />
              </h3>
              {isEditMode && skill.type == 'weapon2' && (
                <button
                  type='button'
                  aria-label='移除技能'
                  onClick={() => {
                    function removeSkill(localCharacter: CharacterWithFaction) {
                      localCharacter.skills = localCharacter.skills.filter(
                        ({ type }: Skill) => type != 'weapon2'
                      );
                    }
                    removeSkill(characters[characterId]!);
                  }}
                  className='w-8 h-8 flex items-center justify-center ml-auto bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                >
                  <TrashIcon className='w-4 h-4' aria-hidden='true' />
                </button>
              )}
            </div>

            {hasProperties && (
              <div className='text-sm text-gray-500 dark:text-gray-400 mt-1 px-2'>
                {properties.map((prop, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && !isEditMode && ' · '}
                    {prop}
                  </React.Fragment>
                ))}
              </div>
            )}

            {(skill.type != 'passive' || 'description' in skill || isEditMode) && (
              <div className='mt-3 px-2'>
                <div className='text-gray-700 dark:text-gray-300 py-2 whitespace-pre-wrap'>
                  <EditableField
                    initialValue={
                      (isDetailed && skill.detailedDescription?.trim()
                        ? skill.detailedDescription
                        : skill.description) ?? '<无内容>'
                    }
                    path={`skills.${skillIndex}.${isDetailed ? 'detailedDescription' : 'description'}`}
                    tag='span'
                    data-tutorial-id='skill-description-edit'
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {/*手机版-标题栏*/}
        {isMobile && (
          <div className='flex-1'>
            <div className='flex justify-between items-center'>
              <h3 className='text-xl font-bold px-2 dark:text-white'>
                {getSkillTypeLabel(skill.type)} ·{' '}
                <EditableField
                  tag='span'
                  id={`Skill:${skill.name}`}
                  path={`skills.${skillIndex}.name`}
                  initialValue={skill.name}
                  onSave={(newName) => {
                    // Update skill with new name and regenerate image URL
                    const factionId = localCharacter.factionId!;

                    const skill = characters[characterId]!.skills[skillIndex]!;
                    skill.name = newName;
                    skill.imageUrl = AssetManager.getSkillImageUrl(
                      localCharacter?.id,
                      { ...skill, name: newName },
                      factionId
                    );
                  }}
                />
              </h3>
              {isEditMode && skill.type == 'weapon2' && (
                <button
                  type='button'
                  aria-label='移除技能'
                  onClick={() => {
                    function removeSkill(localCharacter: CharacterWithFaction) {
                      localCharacter.skills = localCharacter.skills.filter(
                        ({ type }: Skill) => type != 'weapon2'
                      );
                    }
                    removeSkill(characters[characterId]!);
                  }}
                  className='w-8 h-8 flex items-center justify-center ml-auto bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
                >
                  <TrashIcon className='w-4 h-4' aria-hidden='true' />
                </button>
              )}
            </div>

            {!isEditMode && hasProperties && (
              <div className='text-sm text-gray-500 dark:text-gray-400 mt-1 px-2'>
                {properties.map((prop, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && !isEditMode && ' · '}
                    {prop}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/*手机版-主体栏*/}
      {isMobile && (
        <div className='flex-1'>
          {isEditMode && hasProperties && (
            <div className='text-sm text-gray-500 dark:text-gray-400 mt-1 px-2 divide-y divide-dashed divide-gray-300'>
              {properties.map((prop, index) => (
                <React.Fragment key={index}>
                  {index > 0 && !isEditMode && ' · '}
                  {prop}
                </React.Fragment>
              ))}
            </div>
          )}
          {(skill.type != 'passive' || 'description' in skill || isEditMode) && (
            <div className='mt-3 px-2'>
              <div className='text-gray-700 dark:text-gray-300 py-2 whitespace-pre-wrap'>
                <EditableField
                  initialValue={
                    (isDetailed && skill.detailedDescription?.trim()
                      ? skill.detailedDescription
                      : skill.description) ?? '<无内容>'
                  }
                  path={`skills.${skillIndex}.${isDetailed ? 'detailedDescription' : 'description'}`}
                  tag='span'
                  data-tutorial-id='skill-description-edit'
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className='mt-6'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {skill.skillLevels
            .filter((level: SkillLevel) => {
              // Hide Lv.1 if: 1) mobile layout, 2) edit mode off, 3) description is empty for current detailed mode
              if (level.level === 1 && isMobile && !isEditMode) {
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
                  'p-4 rounded dark:text-gray-300',
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
                  <EditableField
                    initialValue={
                      isDetailed && level.detailedDescription?.trim()
                        ? level.detailedDescription
                        : level.description
                    }
                    tag='span'
                    path={`skills.${skillIndex}.skillLevels.${level.level - 1}.${isDetailed ? 'detailedDescription' : 'description'}`}
                  />
                </p>
              </div>
            ))}
        </div>
      </div>
      <div className='mt-4'>
        <SkillTraitsCard skill={skill as Skill} />
      </div>
    </div>
  );
}
