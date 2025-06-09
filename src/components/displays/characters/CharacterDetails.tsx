import React, { useState } from 'react';
import Image from 'next/image';
import { getPositioningTagColors, getPositioningTagContainerColor, getSkillLevelColors, getSkillLevelContainerColor } from '@/lib/design-tokens';
import { getTooltipContent, getPositioningTagTooltipContent, getItemKeyTooltipContent } from '@/lib/tooltipUtils';
import { CharacterDetailsProps } from '@/lib/types';
import Tooltip from '../../ui/Tooltip';
import Tag from '../../ui/Tag';
import SkillAllocationDisplay from './SkillAllocationDisplay';

// Component to render text with item key tooltips
const TextWithItemKeyTooltips = ({ text, isDetailed }: { text: string; isDetailed: boolean }) => {
  if (!text.includes('道具键*')) {
    return <>{text}</>;
  }

  // Pattern to match "道具键*" followed by action verb
  const itemKeyPattern = /道具键\*([^（]*)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = itemKeyPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Extract the action verb (e.g., "打断", "取消后摇")
    const actionVerb = match[1].trim();

    // Add the interactive tooltip part for "道具键*" only, followed by the action verb as regular text
    parts.push(
      <Tooltip
        key={match.index}
        content={getItemKeyTooltipContent(actionVerb, isDetailed)}
      >
        道具键*
      </Tooltip>
    );

    // Add the action verb as regular text
    if (actionVerb) {
      parts.push(actionVerb);
    }

    lastIndex = itemKeyPattern.lastIndex;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return <>{parts}</>;
};

export default function CharacterDetails({ character, isDetailedView: propIsDetailedView }: CharacterDetailsProps) {
  // State to track if all skills are showing detailed descriptions
  // Use the prop value if provided, otherwise use local state
  const [localIsDetailedView, setLocalIsDetailedView] = useState<boolean>(false);

  // Use prop value if provided, otherwise use local state
  const isDetailedView = propIsDetailedView !== undefined ? propIsDetailedView : localIsDetailedView;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="card h-full">
            <div className="w-full h-64 bg-gray-200 rounded-lg relative overflow-hidden mb-4">
              <div className="flex items-center justify-center h-full">
                <Image
                  src={character.imageUrl}
                  alt={character.id}
                  width={200}
                  height={200}
                  unoptimized
                  style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold py-2">
              {character.id} <span className="text-xl font-normal text-gray-400">({character.faction.name})</span>
            </h1>

            {/* Character description */}
            <p className="text-blue-600 mt-2 py-1">
              {character.description}
            </p>

            {/* Character attributes section */}
            <div className="mt-6 space-y-3">
              {/* Common attributes for all characters */}
              <div className="grid grid-cols-2 gap-3">
                {character.maxHp && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('Hp上限', character.faction.id as 'cat' | 'mouse', isDetailedView)}>Hp上限</Tooltip>: {character.maxHp}
                  </p>
                )}

                {character.hpRecovery && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('Hp恢复', character.faction.id as 'cat' | 'mouse', isDetailedView)}>Hp恢复</Tooltip>: {character.hpRecovery}
                  </p>
                )}
                {character.moveSpeed && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('移速', character.faction.id as 'cat' | 'mouse', isDetailedView)}>移速</Tooltip>: {character.moveSpeed}
                  </p>
                )}
                {character.jumpHeight && character.faction.id === 'mouse' && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('跳跃', character.faction.id as 'cat' | 'mouse', isDetailedView)}>跳跃</Tooltip>: {character.jumpHeight}
                  </p>
                )}
                
                {/* Cat faction */}
                {character.faction.id === 'cat' && character.clawKnifeRange && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('爪刀范围', 'cat', isDetailedView)}>爪刀范围</Tooltip>: {character.clawKnifeRange}
                  </p>
                )}
                {character.faction.id === 'cat' && character.clawKnifeCdHit && character.clawKnifeCdUnhit && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('爪刀CD', 'cat', isDetailedView)}>爪刀CD</Tooltip>: {character.clawKnifeCdUnhit} / {character.clawKnifeCdHit} 秒
                  </p>
                )}
                
                {/* Mouse faction */}
                {character.faction.id === 'mouse' && character.attackBoost !== undefined && character.attackBoost !== 0 && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('攻击增伤', 'mouse', isDetailedView)}>攻击增伤</Tooltip>: {character.attackBoost}
                  </p>
                )}
                {character.faction.id === 'mouse' && character.cheesePushSpeed && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('推速', 'mouse', isDetailedView)}>推速</Tooltip>: {character.cheesePushSpeed} %/秒
                  </p>
                )}
                {character.faction.id === 'mouse' && character.wallCrackDamageBoost && (
                  <p className="text-sm text-gray-700 py-1">
                    <Tooltip content={getTooltipContent('墙缝增伤', 'mouse', isDetailedView)}>墙缝增伤</Tooltip>: {character.wallCrackDamageBoost}
                  </p>
                )}
              </div>

              {/* Cat attackBoost if it exists */}
              {character.faction.id === 'cat' && character.attackBoost !== undefined && character.attackBoost !== 0 && (
                <p className="text-amber-600 py-1">
                  <Tooltip content={getTooltipContent('攻击增伤', 'cat', isDetailedView)}>攻击增伤</Tooltip>: {character.attackBoost}
                </p>
              )}

              {/* Positioning tags for cat characters */}
              {character.faction.id === 'cat' && character.catPositioningTags && character.catPositioningTags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">定位</h3>
                  <div className="space-y-3">
                    {character.catPositioningTags.map((tag, index) => (                      <div key={index} className={`rounded-lg p-3 ${getPositioningTagContainerColor(tag.tagName, tag.isMinor, 'cat')}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag
                            colorStyles={getPositioningTagColors(tag.tagName, tag.isMinor, true, 'cat')}
                            size="sm"
                            variant="compact"
                          >
                            <Tooltip content={getPositioningTagTooltipContent(tag.tagName, 'cat', isDetailedView)}>
                              {tag.tagName}
                            </Tooltip>
                          </Tag>
                          {tag.isMinor && (
                            <span className="text-xs text-gray-500">(次要)</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {tag.description}
                        </p>
                        {isDetailedView && tag.additionalDescription && (
                          <p className="text-sm text-gray-600 mt-2 pl-3 border-l-2 border-orange-200">
                            {tag.additionalDescription}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Positioning tags for mouse characters */}
              {character.faction.id === 'mouse' && character.mousePositioningTags && character.mousePositioningTags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">定位</h3>
                  <div className="space-y-3">
                    {character.mousePositioningTags.map((tag, index) => (                      <div key={index} className={`rounded-lg p-3 ${getPositioningTagContainerColor(tag.tagName, tag.isMinor, 'mouse')}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Tag
                            colorStyles={getPositioningTagColors(tag.tagName, tag.isMinor, true, 'mouse')}
                            size="sm"
                            variant="compact"
                          >
                            <Tooltip content={getPositioningTagTooltipContent(tag.tagName, 'mouse', isDetailedView)}>
                              {tag.tagName}
                            </Tooltip>
                          </Tag>
                          {tag.isMinor && (
                            <span className="text-xs text-gray-500">(次要)</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {tag.description}
                        </p>
                        {isDetailedView && tag.additionalDescription && (
                          <p className="text-sm text-gray-600 mt-2 pl-3 border-l-2 border-blue-200">
                            {tag.additionalDescription}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:w-2/3">
          <div className="flex justify-between items-center mb-6 px-2">
            <h2 className="text-2xl font-bold py-2">技能</h2>
            {/* Only show the button if we're using local state (no prop provided) */}
            {propIsDetailedView === undefined && (
              <button
                onClick={() => setLocalIsDetailedView(!localIsDetailedView)}
                className="px-4 py-2 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
              >
                {isDetailedView ? '简明描述' : '详细描述'}
              </button>
            )}
          </div>

          {/* Skill Allocations Section */}
          {character.skillAllocations && character.skillAllocations.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold px-2 py-3 mb-4">加点</h3>
              <div className="space-y-3">
                {character.skillAllocations.map((allocation) => (
                  <div key={allocation.id} className="card p-4">
                    <SkillAllocationDisplay
                      allocation={allocation}
                      characterName={character.id}
                      factionId={character.faction.id as 'cat' | 'mouse'}
                      characterSkills={character.skills}
                      isDetailed={isDetailedView}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills Section */}
          <div className="mb-6">
            <h3 className="text-xl font-bold px-2 py-3">技能描述</h3>
          </div>

          <div className="space-y-6">
            {character.skills.map((skill) => {
              return (
                <div
                  key={skill.id}
                  className="card p-6"
                >
                <div className="flex justify-between items-start">
                  {/* Skill Image */}
                    {skill.imageUrl && (
                      <div className="flex-shrink-0 mr-6">
                        <div
                          className="relative w-16 h-16 rounded-full border-2 overflow-hidden border-gray-300"
                          style={{
                            backgroundColor: '#ffffff'
                          }}
                        >
                          <Image
                            src={skill.imageUrl}
                            alt={skill.name}
                            fill
                            sizes="64px"
                            className="object-cover scale-75"
                          />
                        </div>
                        
                        {/* Video button below skill icon */}
                        {skill.videoUrl && (
                          <div className="mt-2">
                            <button 
                              onClick={() => window.open(skill.videoUrl, '_blank', 'noopener,noreferrer')}
                              className="text-blue-600 text-xs px-2 py-1 hover:underline bg-blue-50 rounded-md hover:bg-blue-100 transition-colors block w-full text-center"
                            >
                              查看视频
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold px-2 py-2">
                          {skill.type === 'ACTIVE' ? '主动 · ' :
                           skill.type === 'WEAPON1' ? '武器1 · ' :
                           skill.type === 'WEAPON2' ? '武器2 · ' : '被动 · '}
                          {skill.name}
                        </h3>
                      </div>

                      {/* Only render the properties section if there's content to display */}
                      {(skill.skillLevels.some(level => level.cooldown) ||
                        skill.canMoveWhileUsing ||
                        skill.canUseInAir ||
                        skill.cancelableSkill ||
                        skill.cancelableAftercast) && (
                        <div className="text-sm text-gray-500 mt-1 px-2">
                          {(() => {
                            const properties = [];

                            // Add CD information if any level has a cooldown
                            if (skill.skillLevels.some(level => level.cooldown)) {
                              const cooldowns = skill.skillLevels.map(level => level.cooldown || '-');
                              const uniqueCooldowns = Array.from(new Set(cooldowns));
                              // If all cooldowns are the same (and not '-'), display as single value
                              if (uniqueCooldowns.length === 1 && uniqueCooldowns[0] !== '-') {
                                properties.push(`CD: ${uniqueCooldowns[0]} 秒`);
                              } else {
                                // Otherwise display all values separated by ' / '
                                properties.push(`CD: ${cooldowns.join(' / ')} 秒`);
                              }
                            }

                            // Add other properties
                            if (skill.canMoveWhileUsing) properties.push('移动释放');
                            if (skill.canUseInAir) properties.push('空中释放');
                            if (skill.cancelableSkill) {
                              properties.push(
                                <TextWithItemKeyTooltips
                                  key="cancelableSkill"
                                  text={skill.cancelableSkill}
                                  isDetailed={isDetailedView}
                                />
                              );
                            }
                            if (skill.cancelableAftercast) {
                              properties.push(
                                <TextWithItemKeyTooltips
                                  key="cancelableAftercast"
                                  text={skill.cancelableAftercast}
                                  isDetailed={isDetailedView}
                                />
                              );
                            }

                            // Join all properties with ' · ' separator
                            return properties.map((prop, index) => (
                              <React.Fragment key={index}>
                                {index > 0 && ' · '}
                                {prop}
                              </React.Fragment>
                            ));
                          })()}
                        </div>
                      )}

                      {/* Only render the description section if there's content to display */}
                      {(() => {
                        const descriptionText = isDetailedView && skill.detailedDescription && skill.detailedDescription.trim() !== ''
                          ? skill.detailedDescription
                          : skill.description;
                        
                        return descriptionText ? (
                          <div className="mt-3 px-2">
                            <p className="text-gray-700 py-2">{descriptionText}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>
                </div>

                <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {skill.skillLevels.map((level) => (
                        <div key={`${skill.id}-${level.level}`} className={`p-4 rounded ${getSkillLevelContainerColor(level.level)}`}>
                          <p className="px-2 py-1">
                            <span
                              className="font-bold"
                              style={{ color: getSkillLevelColors(level.level).color }}
                            >
                              Lv. {level.level}:
                            </span>{' '}
                            {isDetailedView && level.detailedDescription && level.detailedDescription.trim() !== '' ?
                              level.detailedDescription :
                              level.description
                            }
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
