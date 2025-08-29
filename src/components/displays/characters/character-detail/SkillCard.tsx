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
import { DeepReadonly } from 'next/dist/shared/lib/deep-readonly';
import { useDarkMode } from '@/context/DarkModeContext';
import { useMobile } from '@/hooks/useMediaQuery';
import clsx from 'clsx';

interface SkillCardProps {
  skill: DeepReadonly<Skill>;
  isSingleWeapon?: boolean;
  characterId: string;
  skillIndex: number;
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

  const createBooleanCheckbox = (
    label: string,
    property: 'canMoveWhileUsing' | 'canUseInAir' | 'canHitInPipe',
    trueText: string,
    falseText: string
  ) => {
    const skillRef = characters[characterId]!.skills[skillIndex]!;

    return (
      <div className='flex items-center gap-1 text-xs'>
        <span className='text-gray-600'>{label}:</span>
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
        <span className='text-gray-600'>{label}:</span>
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
    if (isEditMode && skill.type !== 'passive') {
      properties.push(
        <div className='text-gray-600 text-xs flex'>
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
            <svg
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
              strokeWidth='2'
              stroke='currentColor'
              className='w-3 h-3'
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
            </svg>
          </button>
        </div>
      );
    }
    if (isEditMode && skill.type != 'passive') {
      properties.push(
        createBooleanCheckbox('移动释放', 'canMoveWhileUsing', '可移动释放', '不可移动释放'),
        createBooleanCheckbox('空中释放', 'canUseInAir', '可空中释放', '不可空中释放'),
        <div className='flex flex-wrap gap-1 items-center'>
          {(() => {
            const specialOptions = ['无前摇', '不可被打断'] as const;
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
                    <span className='text-gray-600'>前摇:</span>
                    <EditableField
                      tag='span'
                      path={`skills.${skillIndex}.forecast`}
                      initialValue={skill.forecast}
                      onSave={(val) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        const n = parseFloat(String(val).trim());
                        s.forecast = Number.isFinite(n) ? n : -1;
                      }}
                    />
                    <span className='text-gray-600'>秒</span>
                  </div>
                  <label className='flex items-center gap-1 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={skill.forecast === 0}
                      onChange={(e) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        s.forecast = e.target.checked ? 0 : -1;
                      }}
                      className='w-3 h-3'
                    />
                    <span className={clsx({ 'font-bold': skill.forecast === 0 })}>无前摇</span>
                  </label>
                </div>
                <div className='flex flex-wrap gap-1 text-xs'>
                  {specialOptions.map((option) => (
                    <label key={option} className='flex items-center gap-1 cursor-pointer'>
                      <input
                        type='checkbox'
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
                      <span className={clsx(skill.cancelableSkill == option ? 'font-bold' : '')}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
                <div className='flex flex-wrap gap-1 text-xs'>
                  <span className='text-gray-600'>可被</span>
                  {cancelableOptions.map((option) => (
                    <label key={option} className='flex items-center gap-1 cursor-pointer'>
                      <input
                        type='checkbox'
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
                            if (option === '道具键' && skill.cancelableSkill.includes('道具键*')) {
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
                        className={clsx({ 'font-bold': activeCancelableOptions.includes(option) })}
                      >
                        {option}
                      </span>
                    </label>
                  ))}
                  <span className='text-gray-600'>打断</span>
                </div>
              </div>
            );
          })()}
        </div>,
        <div className='flex flex-wrap gap-1 items-center'>
          {(() => {
            const specialOptions = ['无后摇', '不可取消后摇'] as const;
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
                    <span className='text-gray-600'>后摇:</span>
                    <EditableField
                      tag='span'
                      path={`skills.${skillIndex}.aftercast`}
                      initialValue={skill.aftercast}
                      onSave={(val) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        const n = parseFloat(String(val).trim());
                        s.aftercast = Number.isFinite(n) ? n : -1;
                      }}
                    />
                    <span className='text-gray-600'>秒</span>
                  </div>
                  <label className='flex items-center gap-1 cursor-pointer'>
                    <input
                      type='checkbox'
                      checked={skill.aftercast === 0}
                      onChange={(e) => {
                        const s = characters[characterId]!.skills[skillIndex]!;
                        s.aftercast = e.target.checked ? 0 : -1;
                      }}
                      className='w-3 h-3'
                    />
                    <span className={clsx({ 'font-bold': skill.aftercast === 0 })}>无后摇</span>
                  </label>
                </div>
                <div className='flex flex-wrap gap-1 text-xs'>
                  {specialOptions.map((option) => (
                    <label key={option} className='flex items-center gap-1 cursor-pointer'>
                      <input
                        type='checkbox'
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
                      <span className={clsx({ 'font-bold': skill.cancelableAftercast == option })}>
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
                <div className='flex flex-wrap gap-1 text-xs'>
                  <span className='text-gray-600'>可被</span>
                  {cancelableOptions.map((option) => (
                    <label key={option} className='flex items-center gap-1 cursor-pointer'>
                      <input
                        type='checkbox'
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
                  <span className='text-gray-600'>取消后摇</span>
                </div>
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
      // Combine forecast with cancelableSkill
      const forecastText =
        skill.forecast < 0
          ? '前摇未测试'
          : skill.forecast === 0
            ? '无前摇'
            : `前摇 ${skill.forecast} 秒`;
      const forecastDisplay = skill.cancelableSkill
        ? `${forecastText}${forecastText === '无前摇' ? '' : '，'}${typeof skill.cancelableSkill === 'string' ? skill.cancelableSkill : convertCancelableSkillToDisplayText(skill.cancelableSkill)}`
        : forecastText;
      properties.push(
        <TextWithItemKeyTooltips key='forecast' text={forecastDisplay} isDetailed={isDetailed} />
      );

      // Combine aftercast with cancelableAftercast
      const aftercastText =
        skill.aftercast < 0
          ? '后摇未测试'
          : skill.aftercast === 0
            ? '无后摇'
            : `后摇 ${skill.aftercast} 秒`;
      const aftercastDisplay = skill.cancelableAftercast
        ? `${aftercastText}${aftercastText === '无后摇' ? '' : '，'}${typeof skill.cancelableAftercast === 'string' ? skill.cancelableAftercast : convertCancelableAftercastToDisplayText(skill.cancelableAftercast)}`
        : aftercastText;
      properties.push(
        <TextWithItemKeyTooltips key='aftercast' text={aftercastDisplay} isDetailed={isDetailed} />
      );

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
    <div className='card p-6! dark:bg-slate-800 dark:border-slate-700'>
      <div className='flex justify-between items-start'>
        {skill.imageUrl && (
          <div className='flex-shrink-0 mr-6'>
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
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  strokeWidth='2'
                  stroke='currentColor'
                  className='w-4 h-4'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
                  />
                </svg>
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
      </div>

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
    </div>
  );
}
