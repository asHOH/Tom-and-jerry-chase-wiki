import React from 'react';
import Image from 'next/image';
import { SkillAllocation } from '@/data/types';
import { parseSkillAllocationPattern, getSkillAllocationImageUrl } from '@/lib/skillAllocationUtils';
import { getSkillLevelColors } from '@/lib/design-tokens';
import Tooltip from '../../ui/Tooltip';

// Component to render text with item key tooltips
const TextWithItemKeyTooltips = ({ text, isDetailed }: { text: string; isDetailed: boolean }) => {
  // For now, just return the text as-is
  // This can be enhanced later to handle item key tooltips
  return <>{text}</>;
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
  const parsedLevels = parseSkillAllocationPattern(allocation.pattern);
  // Calculate actual skill levels at each position
  const skillLevels = { '0': 0, '1': 0, '2': 0, '3': 0 };
  
  const actualLevels = parsedLevels.map((level) => {
    if (level.isParallel && level.parallelOptions) {
      // For parallel skills, both options get the same level increment
      const firstOption = level.parallelOptions[0];
      const secondOption = level.parallelOptions[1];
      
      skillLevels[firstOption]++;
      skillLevels[secondOption]++;
      
      return {
        ...level,
        actualLevel: skillLevels[firstOption],
        parallelActualLevel: skillLevels[secondOption]
      };
    } else {
      skillLevels[level.skillType]++;
      return {
        ...level,
        actualLevel: skillLevels[level.skillType]
      };
    }
  });

  // Create a mapping of skill types to actual skill data
  const skillTypeToSkill = {
    '0': characterSkills.find(s => s.type === 'PASSIVE'),
    '1': characterSkills.find(s => s.type === 'ACTIVE'),
    '2': characterSkills.find(s => s.type === 'WEAPON1'),
    '3': characterSkills.find(s => s.type === 'WEAPON2'),
  };

  const renderSkillIcon = (skillType: '0' | '1' | '2' | '3', actualLevel: number, isDelayed: boolean, hasNegativeEffect: boolean, isSecondaryParallel = false) => {
    const skill = skillTypeToSkill[skillType];
    const imageUrl = skill?.imageUrl || getSkillAllocationImageUrl(
      characterName, 
      skillType, 
      factionId,
      skill?.name
    );

    const baseStyle = {
      ...getSkillLevelColors(actualLevel, true),
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
  // Calculate character levels and group parallel skills
  let characterLevel = 2; // Character starts at level 2
  const levelGroups: Array<{
    characterLevel: number;
    endCharacterLevel?: number;
    levels: typeof actualLevels;
    isParallelGroup: boolean;
  }> = [];

  let i = 0;
  while (i < actualLevels.length) {
    const level = actualLevels[i];
    
    if (level.isParallel && level.parallelOptions) {
      // Find consecutive parallel skills that should be grouped together
      let parallelCount = 0;
      let j = i;
      while (j < actualLevels.length && actualLevels[j].isParallel) {
        parallelCount++;
        j++;
      }
      
      // Group all parallel skills together
      const parallelLevels = actualLevels.slice(i, i + parallelCount);
      
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
          <div className="flex flex-wrap gap-2">
            {levelGroups.map((group, groupIndex) => {
              if (group.isParallelGroup) {
                // Display character level range for parallel skills
                const levelText = group.endCharacterLevel 
                  ? `Lv.${group.characterLevel}~${group.endCharacterLevel}`
                  : `Lv.${group.characterLevel}`;

                // Calculate total width needed for all parallel skills
                const totalWidth = group.levels.length * 44; // 40px + 4px gap per skill

                return (
                  <div key={groupIndex} className="relative flex flex-col items-center" style={{ width: `${totalWidth}px` }}>
                    {/* Character level number range */}
                    <span className="text-xs text-gray-500 mb-2">{levelText}</span>
                    
                    {/* Parallel skill icons container with increased height and proper spacing */}
                    <div className="relative h-12 flex gap-1 justify-center">
                      {group.levels.map((level, levelIndex) => (
                        <div key={levelIndex} className="relative w-10 flex flex-col justify-center">
                          {/* First option (top) */}
                          <div className="absolute" style={{ top: '-7px' }}>
                            {renderSkillIcon(
                              level.parallelOptions![0], 
                              (level as any).actualLevel, 
                              level.isDelayed, 
                              level.hasNegativeEffect
                            )}
                          </div>
                          
                          {/* Second option (bottom) */}
                          <div className="absolute" style={{ top: '19px' }}>
                            {renderSkillIcon(
                              level.parallelOptions![1], 
                              (level as any).parallelActualLevel, 
                              level.isDelayed, 
                              level.hasNegativeEffect, 
                              true
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
                    <span className="text-xs text-gray-500 mb-2">Lv.{group.characterLevel}</span>
                    
                    {/* Skill icon container with consistent height */}
                    <div className="relative">
                      {renderSkillIcon(level.skillType, (level as any).actualLevel, level.isDelayed, level.hasNegativeEffect)}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </div>

      {/* Allocation description */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-sm text-gray-700">
          <TextWithItemKeyTooltips text={allocation.description} isDetailed={isDetailed} />
        </p>
        {isDetailed && allocation.detailedDescription && (
          <p className="text-sm text-gray-600 mt-2 pl-3 border-l-2 border-blue-200">
            <TextWithItemKeyTooltips text={allocation.detailedDescription} isDetailed={isDetailed} />
          </p>
        )}
      </div>
    </div>
  );
};

export default SkillAllocationDisplay;
