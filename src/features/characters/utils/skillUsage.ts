import type { DeepReadonly } from '@/types/deep-readonly';
import type { Skill, SkillDefinition, SkillType, SkillUsageProperties } from '@/data/types';

import {
  convertCancelableAftercastToDisplayText,
  convertCancelableSkillToDisplayText,
} from './skills';

export const skillUsagePropertyKeys = [
  'canMoveWhileUsing',
  'canUseInAir',
  'cancelableSkill',
  'cancelableAftercast',
  'causesWoundedState',
  'forecast',
  'aftercast',
  'canHitInPipe',
  'cooldownTiming',
  'cueRange',
] as const satisfies readonly (keyof SkillUsageProperties)[];

export type SkillUsageSection = {
  label?: string;
  properties: string[];
};

export function hasSkillParts(skill: DeepReadonly<SkillDefinition> | SkillDefinition): skill is (
  DeepReadonly<SkillDefinition> | SkillDefinition
) & {
  parts: readonly DeepReadonly<SkillUsageProperties>[] | SkillUsageProperties[];
} {
  return 'parts' in skill;
}

export function getSkillUsageParts(
  skill: DeepReadonly<SkillDefinition> | SkillDefinition
): readonly DeepReadonly<SkillUsageProperties>[] {
  if (hasSkillParts(skill)) return skill.parts;
  return [skill];
}

export function formatSkillUsageProperties(
  usage: DeepReadonly<SkillUsageProperties>,
  skillType: SkillType
): string[] {
  const properties: string[] = [];

  if (usage.canMoveWhileUsing) properties.push('移动释放');
  if (usage.canUseInAir) properties.push('空中释放');
  if (usage.causesWoundedState) properties.push('可造成受伤状态');

  if (skillType !== 'passive') {
    const forecastBase =
      typeof usage.forecast === 'number'
        ? usage.forecast < 0
          ? '前摇未测试'
          : usage.forecast === 0
            ? '无前摇'
            : `前摇 ${usage.forecast} 秒`
        : undefined;
    const cancelableSkillText =
      usage.forecast !== 0 && usage.cancelableSkill
        ? convertCancelableSkillToDisplayText(usage.cancelableSkill)
        : undefined;
    if (forecastBase || cancelableSkillText) {
      properties.push(
        `${forecastBase ?? ''}${forecastBase && cancelableSkillText ? '，' : ''}${cancelableSkillText ?? ''}`
      );
    }

    const aftercastBase =
      typeof usage.aftercast === 'number'
        ? usage.aftercast < 0
          ? '后摇未测试'
          : usage.aftercast === 0
            ? '无后摇'
            : `后摇 ${usage.aftercast} 秒`
        : undefined;
    const cancelableAftercastText =
      usage.aftercast !== 0 && usage.cancelableAftercast
        ? convertCancelableAftercastToDisplayText(usage.cancelableAftercast)
        : undefined;
    if (aftercastBase || cancelableAftercastText) {
      properties.push(
        `${aftercastBase ?? ''}${aftercastBase && cancelableAftercastText ? '，' : ''}${cancelableAftercastText ?? ''}`
      );
    }
  }

  if (usage.canHitInPipe) properties.push('可击中管道中的角色');
  if (usage.cooldownTiming && usage.cooldownTiming !== '释放时') {
    properties.push(`CD时机: ${usage.cooldownTiming}`);
  }
  if (usage.cueRange && usage.cueRange !== '无音效') {
    properties.push(`技能音效: ${usage.cueRange}`);
  }

  return properties;
}

export function getSkillUsageSections(
  skill: DeepReadonly<SkillDefinition> | SkillDefinition
): SkillUsageSection[] {
  const parts = getSkillUsageParts(skill);
  const showLabels = parts.length > 1;

  return parts.map((part, index) => ({
    ...(showLabels ? { label: `第${index + 1}段` } : {}),
    properties: formatSkillUsageProperties(part, skill.type),
  }));
}

function cloneUsageValue(value: unknown): unknown {
  return Array.isArray(value) ? [...value] : value;
}

export function convertSkillToParts(skill: Skill): void {
  if ('parts' in skill) {
    if (skill.parts.length === 0) skill.parts.push({});
    return;
  }

  const record = skill as unknown as Record<string, unknown>;
  const firstPart = Object.fromEntries(
    skillUsagePropertyKeys
      .filter((key) => record[key] !== undefined)
      .map((key) => [key, cloneUsageValue(record[key])])
  ) as SkillUsageProperties;

  skillUsagePropertyKeys.forEach((key) => delete record[key]);
  record.parts = [firstPart, {}];
}

export function addSkillPart(skill: Skill): void {
  if (!('parts' in skill)) {
    convertSkillToParts(skill);
    return;
  }
  skill.parts.push({});
}

export function removeSkillPart(skill: Skill, partIndex: number): void {
  if (!('parts' in skill) || skill.parts.length <= 1) return;
  skill.parts.splice(partIndex, 1);
}
