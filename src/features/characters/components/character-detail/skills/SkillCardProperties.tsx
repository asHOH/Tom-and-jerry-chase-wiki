'use client';

import React, { Fragment } from 'react';
import uniq from 'lodash-es/uniq';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn } from '@/lib/design';
import type { CharacterWithFaction } from '@/lib/types';
import type { Skill, SkillLevel } from '@/data/types';
import {
  convertCancelableAftercastToDisplayText,
  convertCancelableSkillToDisplayText,
} from '@/features/characters/utils/skills';
import TextWithItemKeyTooltips from '@/features/shared/components/TextWithItemKeyTooltips';
import AddAliasButton from '@/features/shared/detail-view/AddAliasButton';
import { editable } from '@/components/ui/editable';
import { characters } from '@/data';

const e = editable('characters');

type SkillCardPropertiesProps = {
  skill: DeepReadonly<Skill>;
  characterId: string;
  skillIndex: number;
  localCharacter: CharacterWithFaction;
  isEditMode: boolean;
  isDetailed: boolean;
  isMobileEditMode?: boolean;
};

function SkillPropertyList({
  properties,
  isEditMode,
  isMobileEditMode = false,
}: {
  properties: React.ReactNode[];
  isEditMode: boolean;
  isMobileEditMode?: boolean;
}) {
  if (properties.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'mt-1 px-2 text-sm text-gray-500 dark:text-gray-400',
        isMobileEditMode && 'divide-y divide-dashed divide-gray-300'
      )}
    >
      {properties.map((prop, index) => (
        <React.Fragment key={index}>
          {index > 0 && !isEditMode && ' · '}
          {prop}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SkillCardProperties({
  skill,
  characterId,
  skillIndex,
  localCharacter,
  isEditMode,
  isDetailed,
  isMobileEditMode = false,
}: SkillCardPropertiesProps) {
  const getCooldownProperty = () => {
    if (!skill.skillLevels.some((level: SkillLevel) => level.cooldown)) return null;

    const cooldowns = skill.skillLevels.map((level: SkillLevel) => level.cooldown || '-');
    const uniqueCooldowns = uniq(cooldowns);

    if (uniqueCooldowns.length === 1 && uniqueCooldowns[0] !== '-' && !isEditMode) {
      return `CD: ${uniqueCooldowns[0]} 秒`;
    }

    return [
      'CD: ',
      cooldowns.map((i, index) => (
        <React.Fragment key={index}>
          {index != 0 ? '/' : ''}
          <e.span
            path={`skills.${skillIndex}.skillLevels.${index}.cooldown`}
            initialValue={i}
            isSingleLine={true}
          />
        </React.Fragment>
      )),
      ' 秒',
    ];
  };

  const getChargesProperty = () => {
    if (skill.type == 'passive') return null;

    const charges = skill.skillLevels.map((level: SkillLevel) => level.charges || 1);
    const uniqueCharges = uniq(charges);
    if (uniqueCharges.length === 1 && !isEditMode) {
      if (uniqueCharges[0] === 1) return null;
      return `技能存储次数: ${uniqueCharges[0]}`;
    }

    return [
      '技能存储次数: ',
      charges.map((i, index) => (
        <React.Fragment key={index}>
          {index != 0 ? '/' : ''}
          <e.span
            path={`skills.${skillIndex}.skillLevels.${index}.charges`}
            initialValue={i}
            isSingleLine={true}
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
        <label className='flex cursor-pointer items-center gap-1'>
          <input
            type='checkbox'
            checked={skill[property] ?? false}
            onChange={(e) => {
              skillRef[property] = e.target.checked;
            }}
            className='h-3 w-3'
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
            <label key={option} className='flex cursor-pointer items-center gap-1'>
              <input
                type='radio'
                name={`${property}-${skillIndex}`}
                checked={currentValue === option}
                onChange={() => {
                  (skillRef[property] as T) = option;
                }}
                className='h-3 w-3'
              />
              <span className={cn({ 'font-bold': currentValue === option })}>{option}</span>
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
        <div className='flex text-xs text-gray-400 dark:text-gray-500'>
          别名：
          {skill.aliases &&
            skill.aliases.map((alias, index) => (
              <Fragment key={alias}>
                <e.span
                  initialValue={alias}
                  path={`skills.${skillIndex}.aliases.${index}`}
                  isSingleLine={true}
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
          <AddAliasButton
            onAdd={() => {
              const skill = characters[characterId]!.skills[skillIndex]!;
              if (!skill.aliases) {
                skill.aliases = [];
              }
              if (skill.aliases.indexOf('新别名') === -1) {
                skill.aliases.push('新别名');
              }
            }}
          />
        </div>
      );
    }
    if (isEditMode && skill.type != 'passive') {
      properties.push(
        createBooleanCheckbox('移动释放', 'canMoveWhileUsing', '可移动释放', '不可移动释放'),
        createBooleanCheckbox('空中释放', 'canUseInAir', '可空中释放', '不可空中释放'),
        localCharacter.factionId == 'cat'
          ? createBooleanCheckbox(
              '造成受伤状态',
              'causesWoundedState',
              '可造成受伤状态',
              '不可造成受伤状态'
            )
          : undefined,
        <div className='flex flex-wrap items-center gap-1'>
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
                    <e.span
                      path={`skills.${skillIndex}.forecast`}
                      initialValue={skill.forecast ?? ''}
                      isSingleLine={true}
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
                  <label className='flex cursor-pointer items-center gap-1'>
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
                      className='h-3 w-3'
                    />
                    <span className={cn({ 'font-bold': skill.forecast === 0 })}>无前摇</span>
                  </label>
                </div>
                {(() => {
                  const disabled = skill.forecast === 0;
                  return (
                    <>
                      <div className={cn('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}>
                        {specialOptions.map((option) => (
                          <label key={option} className='flex cursor-pointer items-center gap-1'>
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
                              className='h-3 w-3'
                            />
                            <span
                              className={cn(skill.cancelableSkill == option ? 'font-bold' : '')}
                            >
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className={cn('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}>
                        <span className='text-xs text-gray-400 dark:text-gray-500'>可被</span>
                        {cancelableOptions.map((option) => (
                          <label key={option} className='flex cursor-pointer items-center gap-1'>
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
                              className='h-3 w-3'
                            />
                            <span
                              className={cn({
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
        <div className='flex flex-wrap items-center gap-1'>
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
                    <e.span
                      path={`skills.${skillIndex}.aftercast`}
                      initialValue={skill.aftercast ?? ''}
                      isSingleLine={true}
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
                  <label className='flex cursor-pointer items-center gap-1'>
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
                      className='h-3 w-3'
                    />
                    <span className={cn({ 'font-bold': skill.aftercast === 0 })}>无后摇</span>
                  </label>
                </div>
                {(() => {
                  const disabled = skill.aftercast === 0;
                  return (
                    <>
                      <div className={cn('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}>
                        {specialOptions.map((option) => (
                          <label key={option} className='flex cursor-pointer items-center gap-1'>
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
                              className='h-3 w-3'
                            />
                            <span
                              className={cn({ 'font-bold': skill.cancelableAftercast == option })}
                            >
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className={cn('flex flex-wrap gap-1 text-xs', disabled && 'opacity-50')}>
                        <span className='text-xs text-gray-400 dark:text-gray-500'>可被</span>
                        {cancelableOptions.map((option) => (
                          <label key={option} className='flex cursor-pointer items-center gap-1'>
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
                              className='h-3 w-3'
                            />
                            <span
                              className={cn({
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
          ['随距离远近变化', '全图可见', '本房间可见', '无音效'] as const,
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

  return (
    <SkillPropertyList
      properties={properties}
      isEditMode={isEditMode}
      isMobileEditMode={isMobileEditMode}
    />
  );
}
