'use client';

import React from 'react';
import uniq from 'lodash-es/uniq';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn, getSkillLevelColors, getSkillLevelContainerColor } from '@/lib/design';
import { useDraftDataRuntime } from '@/hooks/useDraftDataRuntime';
import { useLocalEntity } from '@/hooks/useLocalEditEntity';
import { useMobile } from '@/hooks/useMediaQuery';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import { Skill, SkillLevel, SkillType, SkillUsageProperties } from '@/data/types';
import SkillUsagePropertiesEditor from '@/features/characters/components/character-detail/skills/SkillUsagePropertiesEditor';
import {
  addSkillPart,
  convertSkillToParts,
  getSkillUsageParts,
  getSkillUsageSections,
  hasSkillParts,
  removeSkillPart,
} from '@/features/characters/utils/skillUsage';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import TextWithItemKeyTooltips from '@/features/shared/components/TextWithItemKeyTooltips';
import EditableStringList from '@/features/shared/detail-view/EditableStringList';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { PlusIcon, TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';

import getEntityFactionId from '../lib/getEntityFactionId';

const SKILL_TYPES: readonly SkillType[] = ['active', 'weapon1', 'weapon2', 'passive'];

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

export default function EntitySkillCard({ skill, skillIndex }: SkillCardProps) {
  const { isEditMode } = useEditMode();
  const { isDetailedView: isDetailed } = useAppContext();
  const { entityName } = useLocalEntity();
  const editRuntime = useDraftDataRuntime();
  const rawEntity = editRuntime?.stores.entities[entityName];
  const rawSkill = rawEntity?.skills?.[skillIndex] as (Skill & { cooldown?: number }) | undefined;
  const e = editable('entities');
  const isMobile = useMobile();
  const [isDarkMode] = useDarkMode();

  const getLevelDescription = (level: DeepReadonly<SkillLevel>): string =>
    isDetailed && level.detailedDescription?.trim() ? level.detailedDescription : level.description;

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
    const uniqueCooldowns = uniq(cooldowns);

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

  const cooldownProperty = getCooldownProperty();
  const usageSections = getSkillUsageSections(skill);
  const hasProperties =
    cooldownProperty !== null || usageSections.some((section) => section.properties.length > 0);
  const usageParts = getSkillUsageParts(skill);
  const isMultiPart = hasSkillParts(skill);
  const factionId = rawEntity ? getEntityFactionId(rawEntity) : undefined;

  return (
    <Card className='p-6!'>
      <div className='flex items-start justify-between'>
        {skill.imageUrl && (
          <div className='mr-6 shrink-0'>
            <div className='relative h-16 w-16 overflow-hidden rounded-full border-2 border-gray-300 bg-white dark:border-gray-600 dark:bg-slate-700'>
              <Image
                src={skill.imageUrl}
                alt={skill.name}
                fill
                sizes='64px'
                className='object-contain p-2'
              />
            </div>

            {skill.videoUrl && !isEditMode && (
              <div className='mt-2'>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => window.open(skill.videoUrl, '_blank', 'noopener,noreferrer')}
                  className='block w-full rounded-md bg-blue-50 px-2 py-1 text-center text-xs text-blue-600 transition-colors hover:bg-blue-100 hover:underline dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900'
                >
                  查看视频
                </Button>
              </div>
            )}
          </div>
        )}

        <div className='flex-1'>
          <div className='flex items-center justify-between'>
            <h3 className='px-2 py-2 text-xl font-bold dark:text-white'>
              {isEditMode ? (
                <select
                  aria-label={`衍生物技能${skillIndex + 1}类型`}
                  value={skill.type}
                  onChange={(event) => {
                    if (rawSkill) rawSkill.type = event.target.value as SkillType;
                  }}
                  className='font-inherit cursor-pointer border-none bg-transparent text-inherit outline-none'
                >
                  {SKILL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {getSkillTypeLabel(type)}
                    </option>
                  ))}
                </select>
              ) : (
                getSkillTypeLabel(skill.type)
              )}{' '}
              · <e.span path={`skills.${skillIndex}.name`} initialValue={skill.name} isSingleLine />
            </h3>
            {isEditMode ? (
              <IconButton
                type='button'
                aria-label={`删除衍生物技能${skillIndex + 1}`}
                variant='delete'
                size='sm'
                onClick={() => {
                  if (!rawEntity?.skills) return;
                  const next = rawEntity.skills.filter((_, index) => index !== skillIndex);
                  if (next.length > 0) rawEntity.skills = next;
                  else delete rawEntity.skills;
                }}
              >
                <TrashIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
              </IconButton>
            ) : null}
          </div>

          {!isEditMode && hasProperties && (
            <div className='mt-1 px-2 text-sm text-gray-500 dark:text-gray-400'>
              {cooldownProperty}
              {usageSections.length > 1 ? (
                <div className={cn('space-y-1', cooldownProperty && 'mt-1')}>
                  {usageSections.map((section) => (
                    <div key={section.label}>
                      <span className='font-semibold text-gray-600 dark:text-gray-300'>
                        {section.label}：
                      </span>
                      {section.properties.map((property, propertyIndex) => (
                        <React.Fragment key={property}>
                          {propertyIndex > 0 && ' · '}
                          <TextWithItemKeyTooltips text={property} isDetailed={isDetailed} />
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                usageSections[0]?.properties.map((property, propertyIndex) => (
                  <React.Fragment key={property}>
                    {(cooldownProperty || propertyIndex > 0) && ' · '}
                    <TextWithItemKeyTooltips text={property} isDetailed={isDetailed} />
                  </React.Fragment>
                ))
              )}
            </div>
          )}

          {(isEditMode || 'description' in skill) && (
            <div className='mt-3 px-2'>
              <div className='py-2 whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
                {isEditMode ? (
                  <e.span
                    path={`skills.${skillIndex}.${isDetailed ? 'detailedDescription' : 'description'}`}
                    initialValue={
                      (isDetailed && skill.detailedDescription?.trim()
                        ? skill.detailedDescription
                        : skill.description) ?? '<无内容>'
                    }
                    deleteOnEmpty
                  />
                ) : (
                  <TextWithHoverTooltips
                    text={
                      (isDetailed && skill.detailedDescription?.trim()
                        ? skill.detailedDescription
                        : skill.description) ?? '<无内容>'
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div className='border-border bg-surface-muted mt-4 space-y-3 rounded-md border p-3 text-sm'>
          <div className='grid gap-2 sm:grid-cols-2'>
            <span>
              默认CD:{' '}
              <e.span
                path={`skills.${skillIndex}.cooldown`}
                initialValue={skill.cooldown ?? '<无内容>'}
                valueType='number'
                isSingleLine
                deleteOnEmpty
              />{' '}
              秒
            </span>
            <span>
              图标:{' '}
              <e.span
                path={`skills.${skillIndex}.imageUrl`}
                initialValue={skill.imageUrl ?? '<无内容>'}
                isSingleLine
                deleteOnEmpty
              />
            </span>
            <span className='sm:col-span-2'>
              视频:{' '}
              <e.span
                path={`skills.${skillIndex}.videoUrl`}
                initialValue={skill.videoUrl ?? '<无内容>'}
                isSingleLine
                deleteOnEmpty
              />
            </span>
          </div>
          <div>
            <span className='text-xs text-gray-500 dark:text-gray-400'>技能别名</span>
            <EditableStringList
              values={skill.aliases ?? []}
              itemLabel='技能别名'
              onChange={(aliases) => {
                if (!rawSkill) return;
                if (aliases.length > 0) rawSkill.aliases = aliases;
                else delete rawSkill.aliases;
              }}
            />
          </div>
          {skill.type !== 'passive' ? (
            <div className='space-y-3'>
              {usageParts.map((usage, partIndex) => {
                const usageRef: SkillUsageProperties | undefined = rawSkill
                  ? 'parts' in rawSkill
                    ? rawSkill.parts[partIndex]
                    : rawSkill
                  : undefined;
                if (!usageRef) return null;
                const pathPrefix = isMultiPart
                  ? `skills.${skillIndex}.parts.${partIndex}`
                  : `skills.${skillIndex}`;
                return (
                  <div
                    key={partIndex}
                    className={cn(
                      usageParts.length > 1 &&
                        'rounded border border-dashed border-gray-300 p-2 dark:border-gray-600'
                    )}
                  >
                    {usageParts.length > 1 ? (
                      <div className='mb-2 flex items-center justify-between'>
                        <span className='font-semibold'>第{partIndex + 1}段</span>
                        <IconButton
                          type='button'
                          aria-label={`删除技能第${partIndex + 1}段`}
                          variant='delete'
                          size='xs'
                          disabled={usageParts.length <= 1}
                          onClick={() => {
                            if (rawSkill) removeSkillPart(rawSkill, partIndex);
                          }}
                        >
                          <TrashIcon
                            className={getIconButtonIconClassName('xs')}
                            aria-hidden='true'
                          />
                        </IconButton>
                      </div>
                    ) : null}
                    <SkillUsagePropertiesEditor
                      usage={usage}
                      usageRef={usageRef}
                      pathPrefix={pathPrefix}
                      radioNameSuffix={`entity-${entityName}-${skillIndex}-${partIndex}`}
                      factionId={factionId}
                      scope='entities'
                    />
                  </div>
                );
              })}
              <Button
                variant='unstyled'
                type='button'
                className='inline-flex items-center gap-1 rounded border border-dashed border-blue-400 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30'
                onClick={() => {
                  if (!rawSkill) return;
                  if ('parts' in rawSkill) addSkillPart(rawSkill);
                  else convertSkillToParts(rawSkill);
                }}
              >
                <PlusIcon className='h-3 w-3' aria-hidden='true' />
                {'parts' in skill ? '添加技能段' : '转换为多段技能'}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className='mt-6'>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {skill.skillLevels
            .filter((level: DeepReadonly<SkillLevel>) => {
              // Hide Lv.1 if: 1) mobile layout, 2) edit mode off, 3) description is empty for current detailed mode
              if (level.level === 1 && isMobile && !isEditMode) {
                return getLevelDescription(level)?.trim() !== '';
              }
              return true;
            })
            .map((level: DeepReadonly<SkillLevel>, levelIndex) => (
              <div
                key={`${skill.id}-${level.level}`}
                className={cn(
                  'rounded p-4 dark:text-gray-300',
                  getSkillLevelContainerColor(level.level)
                )}
              >
                <div className='flex items-start justify-between gap-2 px-2 py-1'>
                  <p className='whitespace-pre-wrap'>
                    <span
                      className='font-bold'
                      style={{ color: getSkillLevelColors(level.level, false, isDarkMode).color }}
                    >
                      Lv.
                      {isEditMode ? (
                        <e.span
                          path={`skills.${skillIndex}.skillLevels.${levelIndex}.level`}
                          initialValue={level.level}
                          valueType='number'
                          isSingleLine
                        />
                      ) : (
                        level.level
                      )}
                      :
                    </span>{' '}
                    {!isEditMode ? (
                      <SkillDescriptionPrefix skill={skill} level={level.level} />
                    ) : null}
                    {isEditMode ? (
                      <e.span
                        path={`skills.${skillIndex}.skillLevels.${levelIndex}.${isDetailed ? 'detailedDescription' : 'description'}`}
                        initialValue={getLevelDescription(level) || '<无内容>'}
                      />
                    ) : (
                      <TextWithHoverTooltips text={getLevelDescription(level)} />
                    )}
                    {isEditMode ? (
                      <span className='mt-2 block text-xs text-gray-600 dark:text-gray-300'>
                        CD:{' '}
                        <e.span
                          path={`skills.${skillIndex}.skillLevels.${levelIndex}.cooldown`}
                          initialValue={level.cooldown ?? '<无内容>'}
                          valueType='number'
                          isSingleLine
                          deleteOnEmpty
                        />{' '}
                        秒 · 存储次数:{' '}
                        <e.span
                          path={`skills.${skillIndex}.skillLevels.${levelIndex}.charges`}
                          initialValue={level.charges ?? '<无内容>'}
                          valueType='number'
                          isSingleLine
                          deleteOnEmpty
                        />
                      </span>
                    ) : null}
                  </p>
                  {isEditMode ? (
                    <IconButton
                      type='button'
                      aria-label={`删除技能等级${level.level}`}
                      variant='delete'
                      size='xs'
                      onClick={() => {
                        if (!rawSkill) return;
                        rawSkill.skillLevels = rawSkill.skillLevels.filter(
                          (_, index) => index !== levelIndex
                        );
                      }}
                    >
                      <TrashIcon className={getIconButtonIconClassName('xs')} aria-hidden='true' />
                    </IconButton>
                  ) : null}
                </div>
              </div>
            ))}
        </div>
        {isEditMode ? (
          <IconButton
            type='button'
            aria-label='添加技能等级'
            variant='add'
            size='sm'
            className='mt-3'
            onClick={() => {
              if (!rawSkill) return;
              const nextLevel =
                Math.max(0, ...rawSkill.skillLevels.map((level) => level.level)) + 1;
              rawSkill.skillLevels.push({ level: nextLevel, description: '' });
            }}
          >
            <PlusIcon className={getIconButtonIconClassName('sm')} aria-hidden='true' />
          </IconButton>
        ) : null}
      </div>
    </Card>
  );
}
