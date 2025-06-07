import React from 'react';
import Image from 'next/image';
import { SkillAllocation } from '@/data/types';
import { parseSkillAllocationPattern, getSkillAllocationImageUrl } from '@/lib/skillAllocationUtils';

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

  // Create a mapping of skill types to actual skill data
  const skillTypeToSkill = {
    '0': characterSkills.find(s => s.type === 'PASSIVE'),
    '1': characterSkills.find(s => s.type === 'ACTIVE'),
    '2': characterSkills.find(s => s.type === 'WEAPON1'),
    '3': characterSkills.find(s => s.type === 'WEAPON2'),
  };

  return (
    <div className="space-y-4">
      {/* Skill allocation pattern display */}
      <div className="flex flex-wrap gap-2 justify-center">        {parsedLevels.map((level, index) => {
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
              <span className="text-xs text-gray-500 mb-1">Lv.{index + 1}</span>
              
              {/* Skill icon container */}
              <div className="relative">
                {/* Main skill icon */}
                <div className={`relative w-12 h-12 border-2 overflow-hidden ${
                  level.isDelayed 
                    ? 'border-orange-400 bg-orange-50' // Square style for delayed allocation
                    : 'rounded-full border-gray-300 bg-white' // Circle style for normal allocation
                }`}>
                  <Image
                    src={imageUrl}
                    alt={skill?.name || `技能${level.skillType}`}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover scale-75"
                    unoptimized
                  />
                </div>
                
                {/* Negative effect overlay */}
                {level.hasNegativeEffect && (
                  <div className="absolute -top-1 -right-1 w-4 h-4">
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
                
                {/* Delayed allocation indicator */}
                {level.isDelayed && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border border-white">
                    <span className="text-xs text-white font-bold flex items-center justify-center w-full h-full">!</span>
                  </div>
                )}
              </div>
              
              {/* Skill type label */}
              <span className="text-xs text-gray-600 mt-1 text-center">
                {level.skillType === '0' ? '被动' : 
                 level.skillType === '1' ? '主动' : 
                 level.skillType === '2' ? '武器1' : '武器2'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Allocation description */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">{allocation.id}</h4>
        <p className="text-sm text-gray-700 mb-2">
          <TextWithItemKeyTooltips text={allocation.description} isDetailed={isDetailed} />
        </p>
        {isDetailed && allocation.detailedDescription && (
          <p className="text-sm text-gray-600 pl-3 border-l-2 border-blue-200">
            <TextWithItemKeyTooltips text={allocation.detailedDescription} isDetailed={isDetailed} />
          </p>
        )}
      </div>

      {/* Legend for special markers */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-orange-100 border border-orange-400"></div>
          <span>留加点</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="relative w-3 h-3 bg-gray-200 rounded-full">
            <Image
              src="/images/misc/禁止.png"
              alt="负面效果"
              width={12}
              height={12}
              className="absolute -top-0.5 -right-0.5 w-2 h-2"
              unoptimized
            />
          </div>
          <span>负面效果</span>
        </div>
      </div>
    </div>
  );
};

export default SkillAllocationDisplay;
