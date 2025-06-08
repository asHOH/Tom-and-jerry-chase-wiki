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
  const skillLevels = { '0': 0, '1': 0, '2': 0, '3': 0 }; // All skills start at level 1
  const actualLevels = parsedLevels.map((level) => {
    skillLevels[level.skillType]++; // Increment the level for this skill type
    return {
      ...level,
      actualLevel: skillLevels[level.skillType] // Store the new level
    };
  });

  // Create a mapping of skill types to actual skill data
  const skillTypeToSkill = {
    '0': characterSkills.find(s => s.type === 'PASSIVE'),
    '1': characterSkills.find(s => s.type === 'ACTIVE'),
    '2': characterSkills.find(s => s.type === 'WEAPON1'),
    '3': characterSkills.find(s => s.type === 'WEAPON2'),
  };

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
            {actualLevels.map((level, index) => {
              const skill = skillTypeToSkill[level.skillType];
              const imageUrl = skill?.imageUrl || getSkillAllocationImageUrl(
                characterName, 
                level.skillType, 
                factionId,
                skill?.name
              );

              return (
                <div key={index} className="relative flex flex-col items-center">
                  {/* Skill level number */}
                  <span className="text-xs text-gray-500 mb-1">Lv.{index + 2}</span>
                  
                  {/* Skill icon container */}
                  <div className="relative">
                    {/* Main skill icon with appropriate tooltip */}
                    {level.isDelayed ? (
                      <Tooltip content="留加点：加点瞬间有额外收益，需把握时机">
                        <div className="relative w-10 h-10 border-2 border-orange-400 bg-orange-50 overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={skill?.name || `技能${level.skillType}`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover scale-75"
                            unoptimized
                          />
                        </div>
                      </Tooltip>
                    ) : level.hasNegativeEffect ? (
                      <Tooltip content="负面效果：此技能升级会带来负面效果">
                        <div 
                          className="relative w-10 h-10 border-2 rounded-full overflow-hidden"
                          style={{
                            ...getSkillLevelColors(level.actualLevel, true),
                            borderWidth: '2px',
                            borderStyle: 'solid'
                          }}
                        >
                          <Image
                            src={imageUrl}
                            alt={skill?.name || `技能${level.skillType}`}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover scale-75"
                            unoptimized
                          />
                        </div>
                      </Tooltip>
                    ) : (
                      <div 
                        className="relative w-10 h-10 border-2 rounded-full overflow-hidden"
                        style={{
                          ...getSkillLevelColors(level.actualLevel, true),
                          borderWidth: '2px',
                          borderStyle: 'solid'
                        }}
                      >
                        <Image
                          src={imageUrl}
                          alt={skill?.name || `技能${level.skillType}`}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover scale-75"
                          unoptimized
                        />
                      </div>
                    )}
                    
                    {/* Negative effect overlay (visual indicator only) */}
                    {level.hasNegativeEffect && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 pointer-events-none">
                        <Image
                          src="/images/misc/禁止.png"
                          alt="负面效果"
                          width={16}
                          height={16}
                          className="w-full h-full"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
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
