import isEqual from 'lodash-es/isEqual';

import { skillUsagePropertyKeys } from '@/features/characters/utils/skillUsage';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Fold only proven, value-preserving single-part conversions in the review display. */
export function foldUnchangedSkillStructure(oldValue: unknown, newValue: unknown) {
  const convertedSkills: string[] = [];

  function visit(before: unknown, after: unknown): unknown {
    if (Array.isArray(before) && Array.isArray(after)) {
      return before.map((value, index) => visit(value, after[index]));
    }
    if (!isRecord(before) || !isRecord(after)) return before;

    if (
      typeof before.id === 'string' &&
      before.id === after.id &&
      typeof before.name === 'string' &&
      Array.isArray(before.skillLevels) &&
      Array.isArray(after.skillLevels) &&
      ['active', 'weapon1', 'weapon2', 'passive'].includes(String(before.type)) &&
      before.type === after.type
    ) {
      const beforeHasParts = Object.hasOwn(before, 'parts');
      const afterHasParts = Object.hasOwn(after, 'parts');
      if (beforeHasParts !== afterHasParts) {
        const legacy = beforeHasParts ? after : before;
        const segmented = beforeHasParts ? before : after;
        const parts = segmented.parts;
        const usage = Object.fromEntries(
          skillUsagePropertyKeys
            .filter((key) => Object.hasOwn(legacy, key))
            .map((key) => [key, legacy[key]])
        );
        if (
          Array.isArray(parts) &&
          parts.length === 1 &&
          isRecord(parts[0]) &&
          skillUsagePropertyKeys.every((key) => !Object.hasOwn(segmented, key)) &&
          isEqual(usage, parts[0])
        ) {
          convertedSkills.push(before.name);
          const normalized = { ...before };
          if (afterHasParts) {
            for (const key of skillUsagePropertyKeys) delete normalized[key];
            normalized.parts = parts;
          } else {
            delete normalized.parts;
            Object.assign(normalized, usage);
          }
          return normalized;
        }
      }
    }

    return Object.fromEntries(
      Object.entries(before).map(([key, value]) => [key, visit(value, after[key])])
    );
  }

  return { oldValue: visit(oldValue, newValue), convertedSkills };
}
