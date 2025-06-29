import React, { useState } from 'react';
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
                path={`${characterId}.skills.${skillIndex}.skillLevels.${index}.cooldown`}
                initialValue={i}
              />
            </React.Fragment>
          )),
          ' 秒',
        ]);
      }
    }
    if (isEditMode) {
      properties.push(
        <span
          className='cursor-pointer'
          onClick={() => {
            handleSaveChanges(
              produce(skill, (skill) => {
                skill.canMoveWhileUsing = !skill.canMoveWhileUsing;
              })
            );
          }}
        >
          {skill.canMoveWhileUsing ? '移动释放' : '不可移动释放'}
        </span>,
        <span
          className='cursor-pointer'
          onClick={() => {
            handleSaveChanges(
              produce(skill, (skill) => {
                skill.canUseInAir = !skill.canUseInAir;
              })
            );
          }}
        >
          {skill.canUseInAir ? '空中释放' : '不可空中释放'}
        </span>,
        <span
          className='cursor-pointer'
          onClick={() => {
            handleSaveChanges(
              produce(skill, (skill) => {
                const possibleCancelableSkills = [
                  '不可被打断',
                  '可被道具键*打断',
                  '不可打断',
                  '可被打断',
                  '可被跳跃键打断',
                  '无前摇',
                  '不可被打断*',
                  '可被道具键打断，但不返还CD',
                  '可被道具键打断',
                  '不可取消',
                ];
                const index = possibleCancelableSkills.indexOf(skill.cancelableSkill!);
                const newText = possibleCancelableSkills[index + 1];
                if (newText == undefined) {
                  delete skill.cancelableSkill;
                } else {
                  skill.cancelableSkill = newText;
                }
              })
            );
          }}
        >
          {skill.cancelableSkill ?? '不确定是否可取消'}
        </span>,
        <span
          className='cursor-pointer'
          onClick={() => {
            handleSaveChanges(
              produce(skill, (skill) => {
                const possibleCancelableAftercasts = [
                  '不可取消后摇',
                  '可被道具键*取消后摇',
                  '无后摇',
                  '不可取消',
                  '可被道具键打断',
                  '可被跳跃键取消后摇',
                  '可被道具键取消后摽',
                ];
                const index = possibleCancelableAftercasts.indexOf(skill.cancelableAftercast!);
                const newText = possibleCancelableAftercasts[index + 1];
                if (newText == undefined) {
                  delete skill.cancelableAftercast;
                } else {
                  skill.cancelableAftercast = newText;
                }
              })
            );
          }}
        >
          {skill.cancelableAftercast ?? '不确定是否可取消后摇'}
        </span>,
        <span
          className='cursor-pointer'
          onClick={() => {
            handleSaveChanges(
              produce(skill, (skill) => {
                skill.canHitInPipe = !skill.canHitInPipe;
              })
            );
          }}
        >
          {skill.canHitInPipe ? '可击中管道中的角色' : '不可击中管道中的角色'}
        </span>
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
    }

    return properties;
  };

  const descriptionText =
    isDetailed && skill.detailedDescription?.trim() ? skill.detailedDescription : skill.description;

  const properties = getSkillProperties();
  const hasProperties = properties.length > 0;

  const [showVideoAddress, setShowVideoAddress] = useState(false);

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
                className='object-contain'
                style={{ padding: '8px' }}
              />
            </div>
            {isEditMode && (
              <div className='mt-2'>
                <button
                  type='button'
                  onClick={() => setShowVideoAddress(!showVideoAddress)}
                  className='text-blue-600 text-xs px-2 py-1 hover:underline bg-blue-50 rounded-md hover:bg-blue-100 transition-colors block w-full text-center'
                >
                  {showVideoAddress ? '隐藏视频地址' : '查看视频'}
                </button>
                {showVideoAddress && (
                  <EditableField
                    tag='span'
                    className='text-blue-600 text-xs px-2 py-1 hover:underline bg-blue-50 rounded-md hover:bg-blue-100 transition-colors block w-full text-center wrap-anywhere mt-2'
                    path={`${characterId}.skills.${skillIndex}.videoUrl`}
                    initialValue={skill.videoUrl ?? ''}
                  />
                )}
              </div>
            )}

            {!isEditMode && skill.videoUrl && (
              <div className='mt-2'>
                <button
                  type='button'
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
            {getSkillTypeLabel(skill.type)} ·{' '}
            <EditableField
              tag='span'
              path={`${characterId}.skills.${skillIndex}.name`}
              initialValue={skill.name}
            />
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
              <p className='text-gray-700 py-2'>
                <EditableField
                  initialValue={descriptionText}
                  path={`${characterId}.skills.${skillIndex}.${isDetailed ? 'detailedDescription' : 'description'}`}
                  tag='span'
                />
              </p>
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
                <EditableField
                  initialValue={
                    isDetailed && level.detailedDescription?.trim()
                      ? level.detailedDescription
                      : level.description
                  }
                  tag='span'
                  path={`${characterId}.skills.${skillIndex}.skillLevels.${level.level - 1}.${isDetailed ? 'detailedDescription' : 'description'}`}
                />
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
