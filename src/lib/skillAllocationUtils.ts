// Utility functions for skill allocation parsing and validation

export type ParsedSkillLevel = {
  skillType: '0' | '1' | '2' | '3'; // 0=被动, 1=主动, 2=武器1, 3=武器2
  isDelayed: boolean; // In parentheses - 留加点
  hasNegativeEffect: boolean; // After "-" - 负面效果
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
  
  const negativeMarkerIndex = pattern.indexOf('-');
  const hasNegativeMarker = negativeMarkerIndex !== -1;

  while (i < pattern.length) {
    const char = pattern[i];
    
    if (char === '-') {
      i++;
      continue;
    }

    // Determine if the current position is after the negative marker once.
    const isNegative = hasNegativeMarker && i > negativeMarkerIndex;

    // Check for parallel skills (in brackets)
    if (char === '[') {
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
          skillType: firstOption,
          isDelayed: false,
          hasNegativeEffect: isNegative, // Use the pre-calculated variable
          isParallel: true,
          parallelOptions: [firstOption, secondOption]
        });
      }
      continue;
    }
    
    let skillType: '0' | '1' | '2' | '3' | undefined;
    let isDelayed = false;

    // Check for delayed skills (in parentheses)
    if (char === '(') {
      i++; // Skip opening parenthesis
      skillType = pattern[i] as '0' | '1' | '2' | '3';
      isDelayed = true;
      i += 2; // Skip the number and closing parenthesis
    } else if (['0', '1', '2', '3'].includes(char)) {
      skillType = char as '0' | '1' | '2' | '3';
      i++;
    } else {
      i++;
      continue;
    }

    if (skillType) {
      result.push({
        skillType,
        isDelayed,
        hasNegativeEffect: isNegative, // Use the pre-calculated variable
        isParallel: false,
      });
    }
  }

  return result;
};


/* Get skill type display name */
export const getSkillTypeDisplayName = (skillType: '0' | '1' | '2' | '3'): string => {
  switch (skillType) {
    case '0': return '被动';
    case '1': return '主动';
    case '2': return '武器1';
    case '3': return '武器2';
    default: return '';
  }
};

/* Get skill image URL from the skill data */
export const getSkillAllocationImageUrl = (
  characterName: string,
  skillType: '0' | '1' | '2' | '3',
  factionId: 'cat' | 'mouse',
  skillName?: string
): string => {
  if (skillType === '0') {
    const factionName = factionId === 'cat' ? '猫' : '鼠';
    return `/images/${factionId}Skills/被动-${factionName}.png`;
  }

  const skillNumber = skillType === '1' ? '1' : skillType === '2' ? '2' : '3';
  const suffix = skillName || 'placeholder';
  return `/images/${factionId}Skills/${characterName}${skillNumber}-${suffix}.png`;
};
