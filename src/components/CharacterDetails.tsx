import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Character } from '@/data';

// Tooltip component for property labels
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 200; // Estimated tooltip width
    const tooltipHeight = 40; // Estimated tooltip height

    // Calculate position to avoid going off-screen
    let x = rect.left + rect.width / 2;
    let y = rect.top - tooltipHeight - 8; // 8px gap above the element

    // Adjust horizontal position if tooltip would go off-screen
    if (x + tooltipWidth / 2 > window.innerWidth) {
      x = window.innerWidth - tooltipWidth / 2 - 10;
    } else if (x - tooltipWidth / 2 < 0) {
      x = tooltipWidth / 2 + 10;
    }

    // If tooltip would go above viewport, show it below instead
    if (y < 0) {
      y = rect.bottom + 8;
    }

    setPosition({ x, y });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="cursor-help border-b border-dotted border-gray-400 hover:border-gray-600 transition-colors"
      >
        {children}
      </span>
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white bg-gray-800 rounded-md shadow-lg pointer-events-none transition-opacity duration-200 ease-in-out"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translateX(-50%)',
            opacity: isVisible ? 1 : 0,
          }}
        >
          {content}
          <div
            className="absolute w-2 h-2 bg-gray-800 transform rotate-45"
            style={{
              left: '50%',
              bottom: '-4px',
              transform: 'translateX(-50%) rotate(45deg)',
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
};

// Property label mappings for tooltips
const propertyTooltipsFallback: Record<string, string> = {
  'Hp上限': '健康值上限，俗称“血条”',
  'Hp恢复': '每秒恢复的健康值',
  '移速': '移动速度（经典之家客厅长度为4680）',
  '跳跃': '跳跃高度（猫的跳跃高度为420）',
  '攻击增伤': '对敌方的伤害加成',
  '爪刀CD': '爪刀冷却时间 (未命中/命中)',
  '爪刀范围': '爪刀攻击范围',
  '推速': '推奶酪速度，单位为 %/秒',
  '墙缝增伤': '对墙缝的伤害加成（墙缝基础血量为100）',
};

// Property tooltips organized by faction and description mode
const propertyTooltips = {
  cat: {
    normal: {
      'Hp上限': '健康值上限，俗称"血条"',
      'Hp恢复': '每秒恢复的健康值',
      '移速': '移动速度',
      '跳跃': '跳跃高度',
      '攻击增伤': '对敌方的伤害加成',
      '爪刀CD': '爪刀冷却时间（未命中/命中）',
      '爪刀范围': '爪刀攻击范围',
    },
    detailed: {
      'Hp上限': '健康值上限，俗称"血条"（盘子的伤害是50）',
      'Hp恢复': '健康状态下每秒恢复的健康值',
      '移速': '移动速度（汤姆为755；经典之家客厅长度为4680）',
      '跳跃': '跳跃高度（猫均为420）',
      '攻击增伤': '对敌方的固定伤害加成',
      '爪刀CD': '爪刀冷却时间（未命中/命中）（单位：秒）',
      '爪刀范围': '爪刀攻击范围（汤姆为300）',
    }
  },
  mouse: {
    normal: {
      'Hp上限': '健康值上限，俗称"血条"',
      'Hp恢复': '每秒恢复的健康值',
      '移速': '移动速度',
      '跳跃': '跳跃高度',
      '推速': '推奶酪速度',
      '墙缝增伤': '对墙缝的伤害加成',
    },
    detailed: {
      'Hp上限': '健康值上限，俗称"血条"（盘子的伤害是50）',
      'Hp恢复': '健康状态下每秒恢复的健康值',
      '移速': '移动速度（杰瑞为650；经典之家客厅长度为4680）',
      '跳跃': '跳跃高度（杰瑞为400；猫均为420）',
      '推速': '推奶酪速度',
      '墙缝增伤': '对墙缝的伤害加成（墙缝基础血量为100）',
    }
  }
};

// Helper function to get tooltip content with fallback logic
const getTooltipContent = (property: string, faction: 'cat' | 'mouse', isDetailed: boolean): string => {
  const factionTooltips = propertyTooltips[faction];

  // Try to get detailed tooltip first if in detailed mode
  if (isDetailed && factionTooltips.detailed[property as keyof typeof factionTooltips.detailed]) {
    return factionTooltips.detailed[property as keyof typeof factionTooltips.detailed];
  }

  // Fallback to normal tooltip
  return factionTooltips.normal[property as keyof typeof factionTooltips.normal] ||
         propertyTooltipsFallback[property as keyof typeof propertyTooltipsFallback] ||
         `${property}的相关信息`;
};

// Helper function to create tooltip content for item key cancellation mechanics
const getItemKeyTooltipContent = (actionVerb: string, isDetailed: boolean): string => {
  if (isDetailed) {
    return `需要手中有道具或【所在处有道具且技能在地面原地释放】时才能${actionVerb}`;
  } else {
    return `需要手中有道具`;
  }
};

// Component to render text with item key tooltips
const TextWithItemKeyTooltips = ({ text, isDetailed }: { text: string; isDetailed: boolean }) => {
  // Check if text contains "道具键*"
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

// Extended Character type that includes the faction object (as used in the exported characters)
type CharacterWithFaction = Character & {
  faction: {
    id: string;
    name: string;
  };
  imageUrl: string; // Required in the component
};

type CharacterDetailsProps = {
  character: CharacterWithFaction;
  isDetailedView?: boolean;
};

export default function CharacterDetails({ character, isDetailedView: propIsDetailedView }: CharacterDetailsProps) {
  // State to track if all skills are showing detailed descriptions
  // Use the prop value if provided, otherwise use local state
  const [localIsDetailedView, setLocalIsDetailedView] = useState<boolean>(false);

  // Use prop value if provided, otherwise use local state
  const isDetailedView = propIsDetailedView !== undefined ? propIsDetailedView : localIsDetailedView;

  return (
    <div className="space-y-8"> {/* Padding for navbar is now handled at the page level */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="card h-full">
            <div className="w-full h-64 bg-gray-200 rounded-lg relative overflow-hidden mb-4">
              {/* Always show the image, whether it's a real image or a placeholder */}
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
              </div>

              {/* Cat-specific attributes */}
              {character.faction.id === 'cat' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {character.attackBoost !== undefined && character.attackBoost !== 0 && (
                    <p className="text-amber-600 py-1">
                      <Tooltip content={getTooltipContent('攻击增伤', 'cat', isDetailedView)}>攻击增伤</Tooltip>: {character.attackBoost}
                    </p>
                  )}
                  {character.clawKnifeCdHit && character.clawKnifeCdUnhit && (
                    <p className="text-amber-600 py-1">
                      <Tooltip content={getTooltipContent('爪刀CD', 'cat', isDetailedView)}>爪刀CD</Tooltip>: {character.clawKnifeCdUnhit} / {character.clawKnifeCdHit} 秒
                    </p>
                  )}
                  {character.clawKnifeRange && (
                    <p className="text-amber-600 py-1">
                      <Tooltip content={getTooltipContent('爪刀范围', 'cat', isDetailedView)}>爪刀范围</Tooltip>: {character.clawKnifeRange}
                    </p>
                  )}
                </div>
              )}

              {/* Mouse-specific attributes */}
              {character.faction.id === 'mouse' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {character.cheesePushSpeed && (
                    <p className="text-blue-600 py-1">
                      <Tooltip content={getTooltipContent('推速', 'mouse', isDetailedView)}>推速</Tooltip>: {character.cheesePushSpeed} %/秒
                    </p>
                  )}
                  {character.wallCrackDamageBoost && (
                    <p className="text-blue-600 py-1">
                      <Tooltip content={getTooltipContent('墙缝增伤', 'mouse', isDetailedView)}>墙缝增伤</Tooltip>: {character.wallCrackDamageBoost}
                    </p>
                  )}
                </div>
              )}

              {/* Positioning tags for cat characters */}
              {character.faction.id === 'cat' && character.positioningTags && character.positioningTags.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">定位</h3>
                  <div className="space-y-3">
                    {character.positioningTags.map((tag, index) => (
                      <div key={index} className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            tag.isMinor
                              ? 'bg-gray-100 text-gray-600 border border-gray-300'
                              : 'bg-orange-100 text-orange-700 border border-orange-300'
                          }`}>
                            {tag.tagName}
                          </span>
                          {tag.isMinor && (
                            <span className="text-xs text-gray-500">(次要)</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          {tag.description}
                        </p>
                        {isDetailedView && tag.detailedDescription && (
                          <p className="text-sm text-gray-600 mt-2 pl-3 border-l-2 border-orange-200">
                            {tag.detailedDescription}
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
          <div className="space-y-6">
            {character.skills.map((skill) => {
              return (
                <div key={skill.id} className="card p-6">
                  <div className="flex justify-between items-start">
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
                      {((isDetailedView && skill.detailedDescription) || (!isDetailedView && skill.description)) && (
                        <div className="mt-3 px-2">
                          {isDetailedView && skill.detailedDescription ? (
                            <p className="text-gray-700 py-2">{skill.detailedDescription}</p>
                          ) : (
                            skill.description && <p className="text-gray-700 py-2">{skill.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {skill.skillLevels.map((level) => (
                        <div key={`${skill.id}-${level.level}`} className="bg-gray-100 p-4 rounded">
                          <p className="px-2 py-1">
                            <span className="font-bold">Lv. {level.level}:</span>{' '}
                            {isDetailedView && level.detailedDescription ?
                              level.detailedDescription :
                              level.description
                            }
                          </p>
                          {/* Video button if available */}
                          {level.videoUrl && (
                            <button className="text-blue-600 text-sm mt-3 px-2 py-1 hover:underline">
                              查看视频
                            </button>
                          )}
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
