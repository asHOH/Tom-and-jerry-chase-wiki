'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getSkillLevelColors, getSkillLevelContainerColor } from '@/lib/design-tokens';
import TextWithItemKeyTooltips from '../shared/TextWithItemKeyTooltips';
import { Skill, SkillLevel } from '@/data/types';
import EditableField from '@/components/ui/EditableField';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { useAppContext } from '@/context/AppContext';
import { saveFactionsAndCharacters, setNestedProperty } from '@/lib/editUtils';
import { characters } from '@/data';
import { produce } from 'immer';
import { CharacterWithFaction } from '@/lib/types';
import { getSkillImageUrl } from '@/lib/skillUtils';

interface SkillCardProps {
  skill: Skill;
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
  const { localCharacter, setLocalCharacter } = useLocalCharacter();
  const [showVideoAddress, setShowVideoAddress] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile layout (below md breakpoint: 768px)
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };

    checkMobile();

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }

    return () => {}; // Empty cleanup function for SSR
  }, []);

  const handleSaveChanges = (updatedSkill: Skill) => {
    setNestedProperty(characters, `${localCharacter.id}.skills.${skillIndex}`, updatedSkill);
    saveFactionsAndCharacters();
    setLocalCharacter({
      ...localCharacter,
      skills: localCharacter.skills.map((originalSkill: Skill, i) =>
        i == skillIndex ? updatedSkill : originalSkill
      ),
    });
  };

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
    const properties: React.ReactNode[] = [];

    if (skill.skillLevels.some((level: SkillLevel) => level.cooldown)) {
      const cooldowns = skill.skillLevels.map((level: SkillLevel) => level.cooldown || '-');
      const uniqueCooldowns = Array.from(new Set(cooldowns));

      if (uniqueCooldowns.length === 1 && uniqueCooldowns[0] !== '-' && !isEditMode) {
        properties.push(`CD: ${uniqueCooldowns[0]} 秒`);
      } else {
        properties.push([
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
        ]);
      }
    }
    if (isEditMode && skill.type != 'passive') {
      properties.push(
        <div className='flex items-center gap-1 text-xs'>
          <span className='text-gray-600'>移动释放:</span>
          <label className='flex items-center gap-1 cursor-pointer'>
            <input
              type='checkbox'
              checked={skill.canMoveWhileUsing ?? false}
              onChange={(e) => {
                handleSaveChanges(
                  produce(skill, (skill) => {
                    skill.canMoveWhileUsing = e.target.checked;
                  })
                );
              }}
              className='w-3 h-3'
            />
            <span className='font-bold'>
              {skill.canMoveWhileUsing ? '可移动释放' : '不可移动释放'}
            </span>
          </label>
        </div>,
        <div className='flex items-center gap-1 text-xs'>
          <span className='text-gray-600'>空中释放:</span>
          <label className='flex items-center gap-1 cursor-pointer'>
            <input
              type='checkbox'
              checked={skill.canUseInAir ?? false}
              onChange={(e) => {
                handleSaveChanges(
                  produce(skill, (skill) => {
                    skill.canUseInAir = e.target.checked;
                  })
                );
              }}
              className='w-3 h-3'
            />
            <span className='font-bold'>{skill.canUseInAir ? '可空中释放' : '不可空中释放'}</span>
          </label>
        </div>,
        <div className='flex flex-wrap gap-1 items-center'>
          {(() => {
            const specialOptions = ['无前摇', '不可被打断'];
            const cancelableOptions = [
              '道具键',
              '道具键*',
              '跳跃键',
              '移动键',
              '药水键',
              '本技能键',
              '其他技能键',
            ];

            const currentMethods = skill.cancelableSkill ? skill.cancelableSkill.split('或') : [];

            const activeCancelableOptions = cancelableOptions.filter((opt) =>
              currentMethods.some((method) => method.includes(opt))
            );

            const displayText = () => {
              if (currentMethods.length === 0)
                return <span className='font-bold'>不确定是否可被打断</span>;

              // Extract methods that start with "可被" and end with "打断"
              const cancelableMethods = currentMethods.filter(
                (method) => method.startsWith('可被') && method.endsWith('打断')
              );
              const otherMethods = currentMethods.filter(
                (method) => !method.startsWith('可被') || !method.endsWith('打断')
              );

              const result = [];

              // Handle other methods (like "无前摇", "不可被打断")
              if (otherMethods.length > 0) {
                result.push(otherMethods.join('或'));
              }

              // Handle cancelable methods with optimized format
              if (cancelableMethods.length > 0) {
                const keys = cancelableMethods.map((method) =>
                  method.replace(/^可被/, '').replace(/打断$/, '')
                );
                if (keys.length === 1) {
                  result.push(`可被${keys[0]}打断`);
                } else if (keys.length === 2) {
                  result.push(`可被${keys[0]}或${keys[1]}打断`);
                } else {
                  const lastKey = keys.pop();
                  result.push(`可被${keys.join('、')}或${lastKey}打断`);
                }
              }

              return result.join('或');
            };

            return (
              <div className='space-y-1'>
                <div className='text-xs'>{displayText()}</div>
                <div className='flex flex-wrap gap-1 text-xs'>
                  {specialOptions.map((option) => (
                    <label key={option} className='flex items-center gap-1 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={currentMethods.includes(option)}
                        onChange={(e) => {
                          let newMethods = [...currentMethods];
                          if (e.target.checked) {
                            newMethods = newMethods.filter((m) => !specialOptions.includes(m));
                            newMethods.push(option);
                          } else {
                            newMethods = newMethods.filter((m) => m !== option);
                          }
                          handleSaveChanges(
                            produce(skill, (skill) => {
                              if (newMethods.length === 0) {
                                delete skill.cancelableSkill;
                              } else {
                                skill.cancelableSkill = newMethods.join('或');
                              }
                            })
                          );
                        }}
                        className='w-3 h-3'
                      />
                      <span className={currentMethods.includes(option) ? 'font-bold' : ''}>
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
                          // Keep special options (like "无前摇", "不可被打断")
                          const newMethods = currentMethods.filter((m) =>
                            specialOptions.includes(m)
                          );

                          // Collect selected cancelable options
                          const selectedCancelableOptions = [];
                          if (e.target.checked) {
                            selectedCancelableOptions.push(option);
                          }

                          // Add other currently selected cancelable options
                          cancelableOptions.forEach((opt) => {
                            if (opt !== option && activeCancelableOptions.includes(opt)) {
                              selectedCancelableOptions.push(opt);
                            }
                          });

                          // Format cancelable options as a single optimized string
                          if (selectedCancelableOptions.length > 0) {
                            if (selectedCancelableOptions.length === 1) {
                              newMethods.push(`可被${selectedCancelableOptions[0]}打断`);
                            } else if (selectedCancelableOptions.length === 2) {
                              newMethods.push(
                                `可被${selectedCancelableOptions[0]}或${selectedCancelableOptions[1]}打断`
                              );
                            } else {
                              const lastOption = selectedCancelableOptions.pop();
                              newMethods.push(
                                `可被${selectedCancelableOptions.join('、')}或${lastOption}打断`
                              );
                            }
                          }

                          handleSaveChanges(
                            produce(skill, (skill) => {
                              if (newMethods.length === 0) {
                                delete skill.cancelableSkill;
                              } else {
                                skill.cancelableSkill = newMethods.join('或');
                              }
                            })
                          );
                        }}
                        className='w-3 h-3'
                      />
                      <span className={activeCancelableOptions.includes(option) ? 'font-bold' : ''}>
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
            const specialOptions = ['无后摇', '不可取消后摇'];
            const cancelableOptions = [
              '道具键',
              '道具键*',
              '跳跃键',
              '移动键',
              '药水键',
              '本技能键',
              '其他技能键',
            ];

            const currentMethods = skill.cancelableAftercast
              ? skill.cancelableAftercast.split('或')
              : [];

            const activeCancelableOptions = cancelableOptions.filter((opt) =>
              currentMethods.some((method) => method.includes(opt))
            );

            const displayText = () => {
              if (currentMethods.length === 0)
                return <span className='font-bold'>不确定是否可取消后摇</span>;

              // Extract methods that start with "可被" and end with "打断"
              const cancelableMethods = currentMethods.filter(
                (method) => method.startsWith('可被') && method.endsWith('打断')
              );
              const otherMethods = currentMethods.filter(
                (method) => !method.startsWith('可被') || !method.endsWith('打断')
              );

              const result = [];

              // Handle other methods (like "无后摇", "不可取消后摇")
              if (otherMethods.length > 0) {
                result.push(otherMethods.join('或'));
              }

              // Handle cancelable methods with optimized format
              if (cancelableMethods.length > 0) {
                const keys = cancelableMethods.map((method) =>
                  method.replace(/^可被/, '').replace(/打断$/, '')
                );
                if (keys.length === 1) {
                  result.push(`可被${keys[0]}打断`);
                } else if (keys.length === 2) {
                  result.push(`可被${keys[0]}或${keys[1]}打断`);
                } else {
                  const lastKey = keys.pop();
                  result.push(`可被${keys.join('、')}或${lastKey}打断`);
                }
              }

              return result.join('或');
            };

            return (
              <div className='space-y-1'>
                <div className='text-xs'>{displayText()}</div>
                <div className='flex flex-wrap gap-1 text-xs'>
                  {specialOptions.map((option) => (
                    <label key={option} className='flex items-center gap-1 cursor-pointer'>
                      <input
                        type='checkbox'
                        checked={currentMethods.includes(option)}
                        onChange={(e) => {
                          let newMethods = [...currentMethods];
                          if (e.target.checked) {
                            newMethods = newMethods.filter((m) => !specialOptions.includes(m));
                            newMethods.push(option);
                          } else {
                            newMethods = newMethods.filter((m) => m !== option);
                          }
                          handleSaveChanges(
                            produce(skill, (skill) => {
                              if (newMethods.length === 0) {
                                delete skill.cancelableAftercast;
                              } else {
                                skill.cancelableAftercast = newMethods.join('或');
                              }
                            })
                          );
                        }}
                        className='w-3 h-3'
                      />
                      <span className={currentMethods.includes(option) ? 'font-bold' : ''}>
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
                          // Keep special options (like "无后摇", "不可取消后摇")
                          const newMethods = currentMethods.filter((m) =>
                            specialOptions.includes(m)
                          );

                          // Collect selected cancelable options
                          const selectedCancelableOptions = [];
                          if (e.target.checked) {
                            selectedCancelableOptions.push(option);
                          }

                          // Add other currently selected cancelable options
                          cancelableOptions.forEach((opt) => {
                            if (opt !== option && activeCancelableOptions.includes(opt)) {
                              selectedCancelableOptions.push(opt);
                            }
                          });

                          // Format cancelable options as a single optimized string
                          if (selectedCancelableOptions.length > 0) {
                            if (selectedCancelableOptions.length === 1) {
                              newMethods.push(`可被${selectedCancelableOptions[0]}取消后摇`);
                            } else if (selectedCancelableOptions.length === 2) {
                              newMethods.push(
                                `可被${selectedCancelableOptions[0]}或${selectedCancelableOptions[1]}取消后摇`
                              );
                            } else {
                              const lastOption = selectedCancelableOptions.pop();
                              newMethods.push(
                                `可被${selectedCancelableOptions.join('、')}或${lastOption}取消后摇`
                              );
                            }
                          }

                          handleSaveChanges(
                            produce(skill, (skill) => {
                              if (newMethods.length === 0) {
                                delete skill.cancelableAftercast;
                              } else {
                                skill.cancelableAftercast = newMethods.join('或');
                              }
                            })
                          );
                        }}
                        className='w-3 h-3'
                      />
                      <span className={activeCancelableOptions.includes(option) ? 'font-bold' : ''}>
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
        <div className='flex items-center gap-1 text-xs'>
          <span className='text-gray-600'>管道攻击:</span>
          <label className='flex items-center gap-1 cursor-pointer'>
            <input
              type='checkbox'
              checked={skill.canHitInPipe ?? false}
              onChange={(e) => {
                handleSaveChanges(
                  produce(skill, (skill) => {
                    skill.canHitInPipe = e.target.checked;
                  })
                );
              }}
              className='w-3 h-3'
            />
            <span className='font-bold'>
              {skill.canHitInPipe ? '可击中管道中的角色' : '不可击中管道中的角色'}
            </span>
          </label>
        </div>,
        <div className='flex items-center gap-1 text-xs'>
          <span className='text-gray-600'>CD时机:</span>
          {(() => {
            const cooldownOptions = ['前摇前', '释放时', '释放后'];
            const currentTiming = skill.cooldownTiming ?? '释放时';

            return (
              <div className='flex flex-wrap gap-1'>
                {cooldownOptions.map((option) => (
                  <label key={option} className='flex items-center gap-1 cursor-pointer'>
                    <input
                      type='radio'
                      name={`cooldownTiming-${skillIndex}`}
                      checked={currentTiming === option}
                      onChange={() => {
                        handleSaveChanges(
                          produce(skill, (skill) => {
                            skill.cooldownTiming = option as '前摇前' | '释放时' | '释放后';
                          })
                        );
                      }}
                      className='w-3 h-3'
                    />
                    <span className={currentTiming === option ? 'font-bold' : ''}>{option}</span>
                  </label>
                ))}
              </div>
            );
          })()}
        </div>
      );
    } else {
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

      if (skill.canHitInPipe) properties.push('可击中管道中的角色');
      if (skill.cooldownTiming && skill.cooldownTiming !== '释放时') {
        properties.push(`CD时机: ${skill.cooldownTiming}`);
      }
    }

    return properties;
  };

  const descriptionText =
    isDetailed && skill.detailedDescription?.trim() ? skill.detailedDescription : skill.description;

  const properties = getSkillProperties();
  const hasProperties = properties.length > 0;

  return (
    <div className='card p-6 dark:bg-slate-800 dark:border-slate-700'>
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
                  className={`text-xs px-2 py-1 rounded-md block w-full text-center transition-colors ${
                    skill.videoUrl
                      ? 'text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
                      : 'text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-red-900'
                  }`}
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
                      // Don't save if the value is the default placeholder text
                      if (newValue.trim() === '输入视频网址' || newValue.trim() === '') {
                        // Clear the video URL
                        handleSaveChanges(
                          produce(skill, (skill) => {
                            delete skill.videoUrl;
                          })
                        );
                      } else {
                        // Save the actual URL
                        handleSaveChanges(
                          produce(skill, (skill) => {
                            skill.videoUrl = newValue.trim();
                          })
                        );
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
                path={`skills.${skillIndex}.name`}
                initialValue={skill.name}
                onSave={(newName) => {
                  // Update skill with new name and regenerate image URL
                  const factionId = localCharacter.faction.id as 'cat' | 'mouse';
                  const updatedSkill = produce(skill, (draft) => {
                    draft.name = newName;
                    draft.imageUrl = getSkillImageUrl(
                      localCharacter.id,
                      { ...draft, name: newName },
                      factionId
                    );
                  });
                  handleSaveChanges(updatedSkill);
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
                  setLocalCharacter((localCharacter) => produce(localCharacter, removeSkill));
                  removeSkill(characters[characterId]!);
                  saveFactionsAndCharacters();
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
                  {index > 0 && ' · '}
                  {prop}
                </React.Fragment>
              ))}
            </div>
          )}

          {descriptionText !== undefined && (
            <div className='mt-3 px-2'>
              <p className='text-gray-700 dark:text-gray-300 py-2 whitespace-pre-wrap'>
                <EditableField
                  initialValue={
                    isDetailed && skill.detailedDescription?.trim()
                      ? skill.detailedDescription
                      : skill.description
                  }
                  path={`skills.${skillIndex}.${isDetailed ? 'detailedDescription' : 'description'}`}
                  tag='span'
                />
              </p>
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
                className={`p-4 rounded ${getSkillLevelContainerColor(level.level)} text-gray-300`}
              >
                <p className='px-2 py-1 whitespace-pre-wrap'>
                  <span
                    className='font-bold'
                    style={{ color: getSkillLevelColors(level.level).color }}
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
