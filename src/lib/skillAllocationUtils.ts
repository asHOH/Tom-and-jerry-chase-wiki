// Utility functions for skill allocation parsing and validation

import type { FactionId } from '@/data/types';

export type ParsedSkillLevel = {
  skillTypeNum: '0' | '1' | '2' | '3'; // 0=被动, 1=主动, 2=武器1, 3=武器2
  isDelayed: boolean; // In parentheses - 留加点
  hasNegativeEffect: boolean; // After "-" - 负面效果
  isParallel?: boolean; // In brackets - parallel skills
  parallelOptions?: Array<'0' | '1' | '2' | '3'>; // Options for parallel skills
  bracketGroupId?: number; // Unique ID for each bracket group
};

export type ValidationError = {
  message: string;
  position?: number;
  severity: 'error' | 'warning';
};

export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
};

/**
 * Validate skill allocation pattern format
 */
export const validateSkillAllocationPattern = (pattern: string): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!pattern || pattern.trim() === '') {
    errors.push({ message: '加点方案不能为空', severity: 'error' });
    return { isValid: false, errors, warnings };
  }

  // Check for invalid characters
  const validChars = /^[0-3\[\]\(\)\-]*$/;
  if (!validChars.test(pattern)) {
    const invalidChars = pattern.match(/[^0-3\[\]\(\)\-]/g);
    errors.push({
      message: `包含无效字符: ${invalidChars?.join(', ')}`,
      severity: 'error',
    });
  }

  // Check bracket matching
  let bracketDepth = 0;
  let parenDepth = 0;
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '[') {
      bracketDepth++;
    } else if (char === ']') {
      bracketDepth--;
      if (bracketDepth < 0) {
        errors.push({
          message: `位置 ${i + 1}: 未匹配的右括号 ']'`,
          position: i,
          severity: 'error',
        });
      }
    } else if (char === '(') {
      parenDepth++;
    } else if (char === ')') {
      parenDepth--;
      if (parenDepth < 0) {
        errors.push({
          message: `位置 ${i + 1}: 未匹配的右括号 ')'`,
          position: i,
          severity: 'error',
        });
      }
    }
  }

  if (bracketDepth > 0) {
    errors.push({ message: '存在未闭合的方括号', severity: 'error' });
  }
  if (parenDepth > 0) {
    errors.push({ message: '存在未闭合的圆括号', severity: 'error' });
  }

  // Check parallel group content
  const bracketMatches = pattern.match(/\[([^\]]+)\]/g);
  if (bracketMatches) {
    bracketMatches.forEach((match, index) => {
      const content = match.slice(1, -1); // Remove brackets
      if (content.length === 0) {
        errors.push({ message: `并行组 ${index + 1} 内容为空`, severity: 'error' });
      } else if (content.length % 2 !== 0) {
        errors.push({
          message: `并行组 ${index + 1} 内容长度必须为偶数: ${content}`,
          severity: 'error',
        });
      } else {
        // Check if all characters in parallel group are valid skill types
        for (const char of content) {
          if (!['0', '1', '2', '3'].includes(char)) {
            errors.push({
              message: `并行组 ${index + 1} 包含无效技能类型: ${char}`,
              severity: 'error',
            });
          }
        }
      }
    });
  }

  // Check parentheses content
  const parenMatches = pattern.match(/\(([^\)]+)\)/g);
  if (parenMatches) {
    parenMatches.forEach((match, index) => {
      const content = match.slice(1, -1); // Remove parentheses
      if (content.length !== 1) {
        errors.push({
          message: `留加点 ${index + 1} 只能包含单个技能类型: ${content}`,
          severity: 'error',
        });
      } else if (!['0', '1', '2', '3'].includes(content)) {
        errors.push({
          message: `留加点 ${index + 1} 包含无效技能类型: ${content}`,
          severity: 'error',
        });
      }
    });
  }

  // Check for common mistakes
  if (pattern.includes('--')) {
    warnings.push({ message: '检测到连续的负面效果标记', severity: 'warning' });
  }

  if (pattern.length > 20) {
    warnings.push({ message: '加点方案较长，请确认是否正确', severity: 'warning' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Parse skill allocation pattern string into individual skill levels
 * Format: "021112200" or "013(0)3301-1" or "011[12]20-0"
 */
export const parseSkillAllocationPattern = (pattern: string): ParsedSkillLevel[] => {
  // Validate pattern first
  const validation = validateSkillAllocationPattern(pattern);
  if (!validation.isValid) {
    throw new Error(
      `Invalid skill allocation pattern: ${validation.errors.map((e) => e.message).join(', ')}`
    );
  }

  const result: ParsedSkillLevel[] = [];
  let i = 0;
  let bracketGroupCounter = 0;
  let nextSkillIsNegative = false;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === '-') {
      nextSkillIsNegative = true;
      i++;
      continue;
    }

    // Current skill inherits the negative flag and resets it
    const isNegative = nextSkillIsNegative;
    nextSkillIsNegative = false;

    // Check for parallel skills (in brackets)
    if (char === '[') {
      const currentBracketGroupId = bracketGroupCounter++;
      i++; // Skip opening bracket

      let bracketContent = '';
      while (i < pattern.length && pattern[i] !== ']') {
        bracketContent += pattern[i];
        i++;
      }
      i++; // Skip closing bracket

      if (bracketContent.length % 2 !== 0) {
        throw new Error(`Parallel skill content must have even length: ${bracketContent}`);
      }

      const halfLength = bracketContent.length / 2;
      const firstHalf = bracketContent.slice(0, halfLength);
      const secondHalf = bracketContent.slice(halfLength);

      for (let j = 0; j < halfLength; j++) {
        const firstOption = firstHalf[j] as '0' | '1' | '2' | '3';
        const secondOption = secondHalf[j] as '0' | '1' | '2' | '3';

        result.push({
          skillTypeNum: firstOption,
          isDelayed: false,
          hasNegativeEffect: isNegative, // Use the pre-calculated variable
          isParallel: true,
          parallelOptions: [firstOption, secondOption],
          bracketGroupId: currentBracketGroupId,
        });
      }
      continue;
    }

    let skillTypeNum: '0' | '1' | '2' | '3' | undefined;
    let isDelayed = false;

    // Check for delayed skills (in parentheses)
    if (char === '(') {
      i++; // Skip opening parenthesis
      skillTypeNum = pattern[i] as '0' | '1' | '2' | '3';
      isDelayed = true;
      i += 2; // Skip the number and closing parenthesis
    } else if (['0', '1', '2', '3'].includes(char!)) {
      skillTypeNum = char as '0' | '1' | '2' | '3';
      i++;
    } else {
      i++;
      continue;
    }

    if (skillTypeNum) {
      result.push({
        skillTypeNum: skillTypeNum,
        isDelayed,
        hasNegativeEffect: isNegative, // Use the pre-calculated variable
        isParallel: false,
      });
    }
  }

  return result;
};

/**
 * Safe version of parseSkillAllocationPattern that returns null on error
 */
export const safeParseSkillAllocationPattern = (pattern: string): ParsedSkillLevel[] | null => {
  try {
    return parseSkillAllocationPattern(pattern);
  } catch (error) {
    console.error('Failed to parse skill allocation pattern:', error);
    return null;
  }
};

/* Get skill type display name */
export const getSkillTypeDisplayName = (skillTypeNum: '0' | '1' | '2' | '3'): string => {
  switch (skillTypeNum) {
    case '0':
      return '被动';
    case '1':
      return '主动';
    case '2':
      return '武器1';
    case '3':
      return '武器2';
    default:
      return '';
  }
};

/* Get skill image URL from the skill data */
export const getSkillAllocationImageUrl = (
  characterName: string,
  skillTypeNum: '0' | '1' | '2' | '3',
  factionId: FactionId,
  skillName?: string
): string => {
  if (skillTypeNum === '0') {
    const factionName = factionId === 'cat' ? '猫' : '鼠';
    return `/images/${factionId}Skills/被动-${factionName}.png`;
  }

  const skillNumber = skillTypeNum === '1' ? '1' : skillTypeNum === '2' ? '2' : '3';
  const suffix = skillName || 'placeholder';
  return `/images/${factionId}Skills/${characterName}${skillNumber}-${suffix}.png`;
};
