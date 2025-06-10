import React from 'react';
import Image from 'next/image';
import { SkillAllocation } from '@/data/types';
import { parseSkillAllocationPattern, getSkillAllocationImageUrl, ParsedSkillLevel } from '@/lib/skillAllocationUtils';
import { getSkillLevelColors } from '@/lib/design-tokens';
import Tooltip from '../../ui/Tooltip';

// Component to render text with item key tooltips
const TextWithItemKeyTooltips = ({ text }: { text: string; isDetailed: boolean }) => {
  // For now, just return the text as-is
  // This can be enhanced later to handle item key tooltips
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
    type: 'ACTIVE' | 'WEAPON1' | 'WEAPON2' | 'PASSIVE';
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
  isDetailed
}) => {
  // Preprocess pattern to auto-parallel first two skills if needed
  const preprocessPattern = (pattern: string): string => {
    // Check if first two characters are regular skills (not delayed, not already parallel)
    if (pattern.length >= 2) {
      const firstChar = pattern[0];
      const secondChar = pattern[1];
      
      // Check if first two are regular numbers and not already in brackets or parentheses
      const isFirstRegular = ['0', '1', '2', '3'].includes(firstChar);
      const isSecondRegular = ['0', '1', '2', '3'].includes(secondChar);
      const isFirstDelayed = pattern.startsWith('(');
      const isSecondDelayed = pattern.charAt(1) === '(' || (pattern.charAt(0) === '(' && pattern.charAt(3) === '(');
      const isAlreadyParallel = pattern.startsWith('[');
      
      if (isFirstRegular && isSecondRegular && !isFirstDelayed && !isSecondDelayed && !isAlreadyParallel) {
        // Wrap first two characters in brackets
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
      // For parallel skills, both options get the same level increment
      const firstOption = level.parallelOptions[0];
      const secondOption = level.parallelOptions[1];
      
      skillLevels[firstOption]++;
      skillLevels[secondOption]++;
      
      return {
        ...level,
        currentLevel: skillLevels[firstOption],
        parallelCurrentLevel: skillLevels[secondOption]
      };
    } else {
      skillLevels[level.skillType]++;
      return {
        ...level,
        currentLevel: skillLevels[level.skillType]
      };
    }
  });

  // Create a mapping of skill types to current skill data
  const skillTypeMap = {
    '0': characterSkills.find(s => s.type === 'PASSIVE'),
    '1': characterSkills.find(s => s.type === 'ACTIVE'),
    '2': characterSkills.find(s => s.type === 'WEAPON1'),
    '3': characterSkills.find(s => s.type === 'WEAPON2'),
  };

  const renderSkillIcon = (skillType: '0' | '1' | '2' | '3', currentLevel: number, isDelayed: boolean, hasNegativeEffect: boolean) => {
    const skill = skillTypeMap[skillType];
    const imageUrl = skill?.imageUrl || getSkillAllocationImageUrl(
      characterName,
      skillType,
      factionId,
      skill?.name
    );

    const baseStyle = {
      ...getSkillLevelColors(currentLevel, true),
      borderWidth: '2px',
      borderStyle: 'solid'
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
          className="w-full h-full object-cover scale-75"
          unoptimized
        />
        {hasNegativeEffect && (
          <div className="absolute -top-[5px] -right-[5px] w-4 h-4 pointer-events-none z-10">
            <Image
              src="/images/misc/禁止.png"
              alt="负面效果"
              width={16}
              height={16}
              className="w-full h-full object-contain"
              unoptimized
            />
          </div>
        )}
      </div>
    );

    if (isDelayed) {
      return (
        <span className="inline-block">
          <Tooltip content="留加点：加点瞬间有额外收益，需把握时机">
            {iconElement}
          </Tooltip>
        </span>
      );
    } else if (hasNegativeEffect) {
      return (
        <span className="inline-block">
          <Tooltip content="负面效果：此技能升级会带来负面效果">
            {iconElement}
          </Tooltip>
        </span>
      );
    } else {
      return iconElement;
    }
  };
  // Helper function to render connection lines
  const renderConnectionLine = (groupIndex: number, levelIndex: number, group: typeof levelGroups[0], isParallel: boolean) => {
    const isLastGroup = groupIndex === levelGroups.length - 1;
    const isLastLevelInGroup = levelIndex === group.levels.length - 1;
    const nextGroup = !isLastGroup ? levelGroups[groupIndex + 1] : null;
    
    // Don't render lines for skills with negative effects (usually last skill)
    if (group.levels[levelIndex]?.hasNegativeEffect) {
      return null;
    }
    
    if (isParallel) {
      // For parallel skills
      const isConnectingToParallel = isLastLevelInGroup && nextGroup && nextGroup.isParallelGroup;
      const isConnectingWithinParallel = !isLastLevelInGroup;

      if (isConnectingToParallel || isConnectingWithinParallel) {
        // Parallel to parallel OR within parallel group - straight lines
        return (
          <div className="absolute left-10 top-3 w-4 h-auto">
            <div className="w-full h-px bg-gray-300"></div>
            <div className="w-full h-px bg-gray-300 mt-7"></div>
          </div>
        );
      } else if (isLastLevelInGroup && nextGroup) {
        // Parallel to single - converge
        return (
          <div className="absolute left-10 top-3 w-4 h-7">
            <svg className="w-full h-full" viewBox="0 0 16 28">
              <path
                d="M0 0 Q8 0 16 14"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1"
              />
              <path
                d="M0 28 Q8 28 16 14"
                fill="none"
                stroke="#d1d5db"
                strokeWidth="1"
              />
            </svg>
          </div>
        );
      }
    } else {
      // For single skills
      if (nextGroup) {
        if (nextGroup.isParallelGroup) {
          // Single to parallel - diverge
          return (
            <div className="absolute left-10 top-2 w-4 h-7">
              <svg className="w-full h-full" viewBox="0 0 16 28">
                <path
                  d="M0 14 Q8 14 16 0"
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
                <path
                  d="M0 14 Q8 14 16 28"
                  fill="none"
                  stroke="#d1d5db"
                  strokeWidth="1"
                />
              </svg>
            </div>
          );
        } else {
          // Single to single - straight line
          return (
            <div className="absolute left-10 top-5 w-4 h-px bg-gray-300"></div>
          );
        }
      }
    }
    
    return null;
  };

  // Calculate character levels and group parallel skills
  let characterLevel = 2; // Character starts at level 2
  const levelGroups: Array<{
    characterLevel: number;
    endCharacterLevel?: number;
    levels: typeof currentLevels;
    isParallelGroup: boolean;
  }> = [];

  let i = 0;
  while (i < currentLevels.length) {
    const level = currentLevels[i];
    
    if (level.isParallel && level.parallelOptions) {
      // Find consecutive parallel skills that should be grouped together
      let parallelCount = 0;
      let j = i;
      while (j < currentLevels.length && currentLevels[j].isParallel) {
        parallelCount++;
        j++;
      }
      
      // Group all parallel skills together
      const parallelLevels = currentLevels.slice(i, i + parallelCount);
      
      // For parallel skills, each skill pair takes 2 character levels
      const totalSkillsInGroup = parallelCount * 2;
      
      levelGroups.push({
        characterLevel,
        endCharacterLevel: characterLevel + totalSkillsInGroup - 1,
        levels: parallelLevels,
        isParallelGroup: true
      });
      
      characterLevel += totalSkillsInGroup;
      i += parallelCount;
    } else {
      // Single skill
      levelGroups.push({
        characterLevel,
        levels: [level],
        isParallelGroup: false
      });
      
      characterLevel++;
      i++;
    }
  }

  // Check if we have any description content to display
  const hasDescription = allocation.description && allocation.description.trim() !== '';
  const hasAdditionalDescription = isDetailed && allocation.additionaldescription && allocation.additionaldescription.trim() !== '';
  const shouldShowDescriptionBlock = hasDescription || hasAdditionalDescription;

  return (
    <div className="space-y-3">
      {/* Title and skill allocation pattern display */}
      <div className="flex gap-4">
        {/* Title section - takes ~1/6 horizontal space */}
        <div className="w-1/6 flex-shrink-0">
          <h4 className="font-bold text-gray-800 text-lg leading-tight">{allocation.id}</h4>
        </div>
        
        {/* Skill allocation pattern display - takes remaining space */}
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            {levelGroups.map((group, groupIndex) => {
              if (group.isParallelGroup) {
                // For parallel skills, calculate individual column levels
                // Each column represents a different skill ordering choice
                const totalWidth = group.levels.length * 44; // 40px + 4px gap per skill

                return (
                  <div key={groupIndex} className="relative flex flex-col items-center" style={{ width: `${totalWidth}px` }}>
                    {/* Individual column level labels */}
                    <div className="flex gap-1 justify-center mb-3">
                      {group.levels.map((_level, levelIndex) => {
                        // Calculate levels for each column (first and second skill options)
                        const firstSkillLevel = group.characterLevel + levelIndex;
                        const secondSkillLevel = group.characterLevel + levelIndex + group.levels.length;
                        
                        return (
                          <div key={levelIndex} className="w-10 flex flex-col items-center">
                            <span className="text-xs text-gray-500">Lv.{firstSkillLevel}/{secondSkillLevel}</span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Parallel skill icons container with increased height and proper spacing */}
                    <div className="relative h-12 flex gap-1 justify-center">
                      {group.levels.map((level, levelIndex) => (
                        <div key={levelIndex} className="relative w-10 flex flex-col justify-center">
                          {/* Connection lines for parallel skills */}
                          {renderConnectionLine(groupIndex, levelIndex, group, true)}
                          
                          {/* First option (top) */}
                          <div className="absolute" style={{ top: '-7px' }}>
                            {renderSkillIcon(
                              level.parallelOptions![0],
                              level.currentLevel,
                              level.isDelayed,
                              level.hasNegativeEffect
                            )}
                          </div>
                          
                          {/* Second option (bottom) */}
                          <div className="absolute" style={{ top: '19px' }}>
                            {renderSkillIcon(
                              level.parallelOptions![1],
                              level.parallelCurrentLevel!,
                              level.isDelayed,
                              level.hasNegativeEffect
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                const level = group.levels[0];
                return (
                  <div key={groupIndex} className="relative flex flex-col items-center">
                    {/* Character level number */}
                    <span className="text-xs text-gray-500 mb-4">Lv.{group.characterLevel}</span>
                    
                    {/* Skill icon container with consistent height */}
                    <div className="relative">
                      {/* Connection lines for single skills */}
                      {renderConnectionLine(groupIndex, 0, group, false)}
                      
                      {renderSkillIcon(level.skillType, level.currentLevel, level.isDelayed, level.hasNegativeEffect)}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Allocation description - only render if we have content */}
      {shouldShowDescriptionBlock && (
        <div className="bg-gray-50 p-3 rounded-lg">
          {hasDescription && (
            <p className="text-sm text-gray-700">
              <TextWithItemKeyTooltips text={allocation.description} isDetailed={isDetailed} />
            </p>
          )}
          {hasAdditionalDescription && (
            <p className="text-sm text-gray-600 mt-2 pl-3 border-l-2 border-blue-200">
              <TextWithItemKeyTooltips text={allocation.additionaldescription!} isDetailed={isDetailed} />
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillAllocationDisplay;
