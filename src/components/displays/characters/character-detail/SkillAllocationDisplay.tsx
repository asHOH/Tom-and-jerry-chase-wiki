import React from 'react';
import Image from 'next/image';
import { SkillAllocation } from '@/data/types';
import {
  parseSkillAllocationPattern,
  getSkillAllocationImageUrl,
  ParsedSkillLevel,
} from '@/lib/skillAllocationUtils';
import { getSkillLevelColors } from '@/lib/design-tokens';
import Tooltip from '../../../ui/Tooltip';

// Component to render text with item key tooltips
const TextWithItemKeyTooltips = ({ text }: { text: string; isDetailed: boolean }) => {
  // For now, just return the text as-is
  return <>{text}</>;
};

// Type for processed skill levels with current level information
type ProcessedSkillLevel = ParsedSkillLevel & {
  currentLevel: number;
  parallelCurrentLevel?: number; // Only present for parallel skills
};

interface SkillAllocationDisplayProps {
  allocation: SkillAllocation;
  characterName: string;
  factionId: 'cat' | 'mouse';
  characterSkills: Array<{
    type: 'active' | 'weapon1' | 'weapon2' | 'passive';
    name: string;
    imageUrl?: string;
  }>;
  isDetailed: boolean;
}

const SkillAllocationDisplay: React.FC<SkillAllocationDisplayProps> = ({
  allocation,
  characterName,
  factionId,
  characterSkills,
  isDetailed,
}) => {
  // Preprocess pattern to auto-parallel first two skills if needed
  const preprocessPattern = (pattern: string): string => {
    if (pattern.length >= 2) {
      const firstChar = pattern[0];
      const secondChar = pattern[1];

      if (!firstChar || !secondChar) {
        return pattern;
      }

      const isFirstRegular = ['0', '1', '2', '3'].includes(firstChar);
      const isSecondRegular = ['0', '1', '2', '3'].includes(secondChar);
      const isAlreadyParallel = pattern.startsWith('[');

      if (isFirstRegular && isSecondRegular && !isAlreadyParallel) {
        return `[${firstChar}${secondChar}]${pattern.slice(2)}`;
      }
    }
    return pattern;
  };

  const processedPattern = preprocessPattern(allocation.pattern);
  const parsedLevels = parseSkillAllocationPattern(processedPattern);

  const skillLevels = { '0': 0, '1': 0, '2': 0, '3': 0 };

  const currentLevels: ProcessedSkillLevel[] = parsedLevels.map((level) => {
    if (level.isParallel && level.parallelOptions) {
      const firstOption = level.parallelOptions[0];
      const secondOption = level.parallelOptions[1];

      if (!firstOption || !secondOption) {
        throw new Error('Invalid parallel options');
      }

      skillLevels[firstOption]++;
      skillLevels[secondOption]++;
      return {
        ...level,
        currentLevel: skillLevels[firstOption],
        parallelCurrentLevel: skillLevels[secondOption],
      };
    } else {
      skillLevels[level.skillType]++;
      return { ...level, currentLevel: skillLevels[level.skillType] };
    }
  });

  const skillTypeMap = {
    '0': characterSkills.find((s) => s.type === 'passive'),
    '1': characterSkills.find((s) => s.type === 'active'),
    '2': characterSkills.find((s) => s.type === 'weapon1'),
    '3': characterSkills.find((s) => s.type === 'weapon2'),
  };

  const renderSkillIcon = (
    skillType: '0' | '1' | '2' | '3',
    currentLevel: number,
    isDelayed: boolean,
    hasNegativeEffect: boolean
  ) => {
    const skill = skillTypeMap[skillType];
    const imageUrl =
      skill?.imageUrl ||
      getSkillAllocationImageUrl(characterName, skillType, factionId, skill?.name);
    const baseStyle = {
      ...getSkillLevelColors(currentLevel, true),
      borderWidth: '2px',
      borderStyle: 'solid',
    };

    const iconElement = (
      <div
        className={`relative w-10 h-10 border-2 ${isDelayed ? '' : 'rounded-full'}`}
        style={baseStyle}
      >
        <Image
          src={imageUrl}
          alt={skill?.name || `技能${skillType}`}
          width={40}
          height={40}
          className='w-full h-full object-contain'
          style={{ padding: '4px' }}
          unoptimized
        />
        {hasNegativeEffect && (
          <div className='absolute -top-[5px] -right-[5px] w-4 h-4 pointer-events-none z-10'>
            <Image
              src='/images/misc/禁止.png'
              alt='负面效果'
              width={16}
              height={16}
              className='w-full h-full object-contain'
              unoptimized
            />
          </div>
        )}
      </div>
    );

    if (isDelayed)
      return (
        <span className='inline-block'>
          <Tooltip content='留加点：加点瞬间有额外收益，需把握时机'>{iconElement}</Tooltip>
        </span>
      );
    if (hasNegativeEffect)
      return (
        <span className='inline-block'>
          <Tooltip content='负面效果：此技能升级会带来负面效果'>{iconElement}</Tooltip>
        </span>
      );
    return iconElement;
  };

  // Calculate character levels and group parallel skills
  let characterLevel = 2;
  const levelGroups: Array<{
    characterLevel: number;
    endCharacterLevel?: number;
    levels: typeof currentLevels;
    isParallelGroup: boolean;
  }> = [];
  let i = 0;
  while (i < currentLevels.length) {
    const level = currentLevels[i]!;

    if (level.isParallel && level.parallelOptions) {
      // Group consecutive parallel levels with the same bracketGroupId
      const currentBracketGroupId = level.bracketGroupId;
      let j = i;
      while (
        j < currentLevels.length &&
        currentLevels[j]?.isParallel &&
        currentLevels[j]?.bracketGroupId === currentBracketGroupId
      ) {
        j++;
      }
      const parallelLevels = currentLevels.slice(i, j);
      levelGroups.push({
        characterLevel,
        endCharacterLevel: characterLevel + parallelLevels.length * 2 - 1,
        levels: parallelLevels,
        isParallelGroup: true,
      });
      characterLevel += parallelLevels.length * 2;
      i = j;
    } else {
      levelGroups.push({ characterLevel, levels: [level], isParallelGroup: false });
      characterLevel++;
      i++;
    }
  }

  // Helper function to render connection lines
  const renderConnectionLine = (
    groupIndex: number,
    levelIndex: number,
    group: (typeof levelGroups)[0],
    isParallel: boolean
  ) => {
    const isLastLevelInGroup = levelIndex === group.levels.length - 1;
    const nextGroup = groupIndex < levelGroups.length - 1 ? levelGroups[groupIndex + 1] : null;

    if (group.levels[levelIndex]?.hasNegativeEffect) return null;

    const checkNextForNegative = (next: typeof nextGroup | null) => {
      if (!next) return false;
      if (next.isParallelGroup) return next.levels.some((l) => l.hasNegativeEffect);
      return next.levels[0]?.hasNegativeEffect;
    };

    const hasNegativeTarget = () => {
      if (isParallel && !isLastLevelInGroup) {
        return group.levels[levelIndex + 1]?.hasNegativeEffect;
      }
      return checkNextForNegative(nextGroup);
    };

    if (hasNegativeTarget()) return null;

    if (isParallel) {
      if (!isLastLevelInGroup) {
        // Within parallel group -> straight lines
        return (
          <div className='absolute left-10 top-3 w-4 h-auto'>
            <div className='w-full h-px bg-gray-400'></div>
            <div className='w-full h-px bg-gray-400 mt-7'></div>
          </div>
        );
      } else if (isLastLevelInGroup && nextGroup?.isParallelGroup) {
        // Parallel to parallel (different groups) -> converge then diverge
        return (
          <div className='absolute left-7 top-3 w-10 h-7'>
            <svg className='w-full h-full overflow-visible' viewBox='0 0 40 28'>
              {/* Converging lines from current group */}
              <path d='M11 0 Q16.5 12 16 14' fill='none' stroke='#9ca3af' strokeWidth='1' />
              <path d='M11 28 Q16.5 16 16 14' fill='none' stroke='#9ca3af' strokeWidth='1' />
              {/* Diverging lines to next group - more visible curves */}
              <path d='M16 14 Q15.5 12 21 0' fill='none' stroke='#9ca3af' strokeWidth='1' />
              <path d='M16 14 Q15.5 16 21 28' fill='none' stroke='#9ca3af' strokeWidth='1' />
            </svg>
          </div>
        );
      } else if (isLastLevelInGroup && nextGroup) {
        // Parallel to single -> converge
        return (
          <div className='absolute left-10 top-3 w-4 h-7'>
            <svg className='w-full h-full' viewBox='0 0 16 28'>
              <path d='M0 0 Q8 0 16 14' fill='none' stroke='#9ca3af' strokeWidth='1' />
              <path d='M0 28 Q8 28 16 14' fill='none' stroke='#9ca3af' strokeWidth='1' />
            </svg>
          </div>
        );
      }
    } else if (nextGroup) {
      if (nextGroup.isParallelGroup) {
        // Single to parallel -> diverge
        return (
          // The top-[7px] value centers the divergence point vertically with the single 40px icon.
          <div className='absolute left-8 top-[7px] w-4 h-7 [transform:scaleX(-1)]'>
            <svg className='w-full h-full' viewBox='0 0 16 28'>
              <path d='M0 1 Q8 1 16 14' fill='none' stroke='#9ca3af' strokeWidth='1' />
              <path d='M0 28 Q8 28 16 14' fill='none' stroke='#9ca3af' strokeWidth='1' />
            </svg>
          </div>
        );
      } else {
        // Single to single -> straight line
        return <div className='absolute left-10 top-5 w-4 h-px bg-gray-400'></div>;
      }
    }
    return null;
  };

  const hasDescription = allocation.description?.trim();
  const hasAdditionalDescription = isDetailed && allocation.additionaldescription?.trim();
  const shouldShowDescriptionBlock = hasDescription || hasAdditionalDescription;

  return (
    <div className='space-y-3'>
      <div className='flex gap-4'>
        <div className='w-1/6 flex-shrink-0'>
          <h4 className='font-bold text-gray-800 text-lg leading-tight'>{allocation.id}</h4>
        </div>
        <div className='flex-1'>
          <div className='flex flex-wrap items-start gap-2 mb-2'>
            {levelGroups.map((group, groupIndex) => (
              <div key={groupIndex} className='relative flex flex-col items-center'>
                {group.isParallelGroup ? (
                  <>
                    <div className='flex gap-1 justify-center mb-3 h-4'>
                      {group.levels.map((_, levelIndex) => (
                        <div key={levelIndex} className='w-10 flex flex-col items-center'>
                          <span className='text-xs text-gray-500'>
                            Lv.{group.characterLevel + levelIndex}/
                            {group.characterLevel + levelIndex + group.levels.length}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className='relative h-12 flex gap-1 justify-center'>
                      {group.levels.map((level, levelIndex) => (
                        <div
                          key={levelIndex}
                          className='relative w-10 flex flex-col justify-center'
                        >
                          {renderConnectionLine(groupIndex, levelIndex, group, true)}
                          <div className='absolute' style={{ top: '-7px' }}>
                            {level.parallelOptions?.[0] &&
                              renderSkillIcon(
                                level.parallelOptions[0],
                                level.currentLevel,
                                level.isDelayed,
                                level.hasNegativeEffect
                              )}
                          </div>
                          <div className='absolute' style={{ top: '19px' }}>
                            {level.parallelOptions?.[1] &&
                              renderSkillIcon(
                                level.parallelOptions[1],
                                level.parallelCurrentLevel!,
                                level.isDelayed,
                                level.hasNegativeEffect
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <span className='text-xs text-gray-500 mb-4 h-4'>
                      Lv.{group.characterLevel}
                    </span>
                    <div className='relative'>
                      {renderConnectionLine(groupIndex, 0, group, false)}
                      {renderSkillIcon(
                        group.levels[0]!.skillType,
                        group.levels[0]!.currentLevel,
                        group.levels[0]!.isDelayed,
                        group.levels[0]!.hasNegativeEffect
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {shouldShowDescriptionBlock && (
        <div className='bg-gray-50 p-3 rounded-lg'>
          {hasDescription && (
            <p className='text-sm text-gray-700'>
              <TextWithItemKeyTooltips text={allocation.description!} isDetailed={isDetailed} />
            </p>
          )}
          {hasAdditionalDescription && (
            <p className='text-sm text-gray-600 mt-2 pl-3 border-l-2 border-blue-200'>
              <TextWithItemKeyTooltips
                text={allocation.additionaldescription!}
                isDetailed={isDetailed}
              />
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillAllocationDisplay;
