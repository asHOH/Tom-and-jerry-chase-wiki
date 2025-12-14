// Utility functions for skill-related operations

import type { DeepReadonly } from '@/types/deep-readonly';
import type { CancelableAftercastType, CancelableSkillType } from '@/data/types';

export function convertCancelableSkillToDisplayText(
  skill: DeepReadonly<CancelableSkillType> | undefined
) {
  if (typeof skill === 'string') {
    return skill; // Directly return if it's a string
  } else if (Array.isArray(skill)) {
    const len = skill.length;
    if (len === 0) return '';
    if (len === 1) return `可被${skill[0]}打断`;
    if (len === 2) return `可被${skill[0]}或${skill[1]}打断`;
    return `可被${skill.slice(0, len - 2).join('、')}、${skill[len - 2]}或${skill[len - 1]}打断`;
  }
  return '不确定是否可被打断';
}

/**
 * Converts CancelableAftercastType to display text.
 */
export function convertCancelableAftercastToDisplayText(
  aftercast: DeepReadonly<CancelableAftercastType> | undefined
) {
  if (typeof aftercast === 'string') {
    return aftercast;
  } else if (Array.isArray(aftercast)) {
    const len = aftercast.length;
    if (len === 0) return '';
    if (len === 1) return `可被${aftercast[0]}取消后摇`;
    if (len === 2) return `可被${aftercast[0]}或${aftercast[1]}取消后摇`;
    return `可被${aftercast.slice(0, len - 2).join('、')}、${aftercast[len - 2]}或${aftercast[len - 1]}取消后摇`;
  }
  return '不确定是否可取消后摇';
}
