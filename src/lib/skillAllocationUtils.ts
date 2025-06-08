// Utility functions for skill allocation parsing and validation

export type ParsedSkillLevel = {
  skillType: '0' | '1' | '2' | '3'; // 0=被动, 1=主动, 2=武器1, 3=武器2
  isDelayed: boolean; // In parentheses - 留加点
  hasNegativeEffect: boolean; // After "-" - negative effects
  isParallel?: boolean; // In brackets - parallel skills
  parallelOptions?: Array<'0' | '1' | '2' | '3'>; // Options for parallel skills
};

/**
 * Parse skill allocation pattern string into individual skill levels
 * Format: "021112200" or "013(0)3301-1" or "011[12]20-0"
 */
export const parseSkillAllocationPattern = (pattern: string): ParsedSkillLevel[] => {
  const result: ParsedSkillLevel[] = [];
  let i = 0;
  let hasNegativeMarker = false;

  // Check if pattern contains negative marker "-"
  const negativeMarkerIndex = pattern.indexOf('-');
  if (negativeMarkerIndex !== -1) {
    hasNegativeMarker = true;
  }

  while (i < pattern.length) {
    const char = pattern[i];
    
    // Skip the negative marker
    if (char === '-') {
      i++;
      continue;
    }

    let skillType: '0' | '1' | '2' | '3';
    let isDelayed = false;
    let hasNegativeEffect = false;
    let isParallel = false;
    let parallelOptions: Array<'0' | '1' | '2' | '3'> = [];

    // Check if this level is parallel (in brackets)
    if (char === '[') {
      isParallel = true;
      i++; // Skip opening bracket
      
      // Extract content inside brackets
      let bracketContent = '';
      while (i < pattern.length && pattern[i] !== ']') {
        bracketContent += pattern[i];
        i++;
      }
      i++; // Skip closing bracket
      
      // Validate bracket content must be even length
      if (bracketContent.length % 2 !== 0) {
        throw new Error(`Parallel skill content must have even length: ${bracketContent}`);
      }
      
      // Split into first half and second half
      const halfLength = bracketContent.length / 2;
      const firstHalf = bracketContent.slice(0, halfLength);
      const secondHalf = bracketContent.slice(halfLength);
      
      // Add each pair as separate parallel entries
      for (let j = 0; j < halfLength; j++) {
        const firstOption = firstHalf[j] as '0' | '1' | '2' | '3';
        const secondOption = secondHalf[j] as '0' | '1' | '2' | '3';
        
        result.push({
          skillType: firstOption, // Use first option as primary
          isDelayed: false,
          hasNegativeEffect: hasNegativeMarker && i > negativeMarkerIndex,
          isParallel: true,
          parallelOptions: [firstOption, secondOption]
        });
      }
      continue;
    }
    // Check if this level is delayed (in parentheses)
    else if (char === '(') {
      i++; // Skip opening parenthesis
      skillType = pattern[i] as '0' | '1' | '2' | '3';
      isDelayed = true;
      i++; // Skip the number
      i++; // Skip closing parenthesis
    } else if (['0', '1', '2', '3'].includes(char)) {
      skillType = char as '0' | '1' | '2' | '3';
      
      // Check if this skill is after the negative marker
      if (hasNegativeMarker && i > negativeMarkerIndex) {
        hasNegativeEffect = true;
      }
      
      i++;
    } else {
      i++;
      continue;
    }

    result.push({
      skillType,
      isDelayed,
      hasNegativeEffect,
      isParallel,
      parallelOptions: parallelOptions.length > 0 ? parallelOptions : undefined
    });
  }

  return result;
};

/**
 * Validate skill allocation pattern
 * Rules:
 * 1. Must have exactly 9 skill levels
 * 2. Each number (0,1,2 or 0,1,3) must appear exactly 3 times
 * 3. Cannot have both 2 and 3 in the same pattern
 * 4. Parallel skills (in brackets) must have even length content
 */
export const validateSkillAllocationPattern = (pattern: string): boolean => {
  try {
    const parsed = parseSkillAllocationPattern(pattern);
    
    // Must have exactly 9 levels
    if (parsed.length !== 9) {
      return false;
    }

    // Count occurrences of each skill type (including parallel options)
    const counts = { '0': 0, '1': 0, '2': 0, '3': 0 };
    
    for (const level of parsed) {
      if (level.isParallel && level.parallelOptions) {
        // For parallel skills, count all options
        for (const option of level.parallelOptions) {
          counts[option]++;
        }
      } else {
        counts[level.skillType]++;
      }
    }

    // Each number must appear exactly 3 times
    if (counts['0'] !== 3 || counts['1'] !== 3) {
      return false;
    }

    // Must have either 3x'2' or 3x'3', but not both
    const hasWeapon1 = counts['2'] === 3;
    const hasWeapon2 = counts['3'] === 3;
    
    if (hasWeapon1 && hasWeapon2) {
      return false; // Cannot have both weapon types
    }
    
    if (!hasWeapon1 && !hasWeapon2) {
      return false; // Must have one weapon type
    }

    return true;
  } catch (error) {
    // If parsing fails (e.g., invalid bracket content), return false
    return false;
  }
};

/**
 * Get skill type display name
 */
export const getSkillTypeDisplayName = (skillType: '0' | '1' | '2' | '3'): string => {
  switch (skillType) {
    case '0': return '被动';
    case '1': return '主动';
    case '2': return '武器1';
    case '3': return '武器2';
    default: return '';
  }
};

/**
 * Get skill image URL for allocation display
 * This function will get the correct image URL from the skill data
 */
export const getSkillAllocationImageUrl = (
  characterName: string,
  skillType: '0' | '1' | '2' | '3',
  factionId: 'cat' | 'mouse',
  skillName?: string
): string => {
  if (skillType === '0') {
    // Passive skills use faction-based naming
    const factionName = factionId === 'cat' ? '猫' : '鼠';
    return `/images/${factionId}Skills/被动-${factionName}.png`;
  }

  // For other skills, use character name + skill number + skill name
  if (skillName) {
    const skillNumber = skillType === '1' ? '1' : skillType === '2' ? '2' : '3';
    return `/images/${factionId}Skills/${characterName}${skillNumber}-${skillName}.png`;
  }

  // Fallback for when skill name is not provided
  const skillNumber = skillType === '1' ? '1' : skillType === '2' ? '2' : '3';
  return `/images/${factionId}Skills/${characterName}${skillNumber}-placeholder.png`;
};
