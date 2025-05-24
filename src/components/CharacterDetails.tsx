import React, { useState } from 'react';
import Image from 'next/image';
import { Character } from '@/data/mockData';

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
                  alt={character.name}
                  width={200}
                  height={200}
                  unoptimized
                  style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%' }}
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold px-4 py-2">{character.name}</h1>

            {/* Combined faction, name and description */}
            <p className="text-blue-600 mt-2 px-4 py-1">
              {character.faction.name} · {character.description}
            </p>

            {/* Character attributes section */}
            <div className="mt-6 space-y-3">
              {/* Common attributes for all characters */}
              <div className="grid grid-cols-2 gap-3">
                {character.maxHp && (
                  <p className="text-sm text-gray-700 px-2 py-1">Hp上限: {character.maxHp}</p>
                )}
                {character.attackBoost !== undefined && character.attackBoost !== 0 && (
                  <p className="text-sm text-gray-700 px-2 py-1">攻击增伤: {character.attackBoost}</p>
                )}
                {character.hpRecovery && (
                  <p className="text-sm text-gray-700 px-2 py-1">Hp恢复: {character.hpRecovery} / 秒</p>
                )}
                {character.moveSpeed && (
                  <p className="text-sm text-gray-700 px-2 py-1">移速: {character.moveSpeed}</p>
                )}
                {character.jumpHeight && (
                  <p className="text-sm text-gray-700 px-2 py-1">跳跃: {character.jumpHeight}</p>
                )}
              </div>

              {/* Cat-specific attributes */}
              {character.faction.id === 'cat' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {character.clawKnifeCdHit && character.clawKnifeCdUnhit && (
                    <p className="text-amber-600 px-2 py-1">爪刀CD (未命中/命中): {character.clawKnifeCdUnhit} / {character.clawKnifeCdHit} 秒</p>
                  )}
                  {character.clawKnifeRange && (
                    <p className="text-amber-600 px-2 py-1">爪刀范围: {character.clawKnifeRange}</p>
                  )}
                </div>
              )}

              {/* Mouse-specific attributes */}
              {character.faction.id === 'mouse' && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {character.cheesePushSpeed && (
                    <p className="text-blue-600 px-2 py-1">推奶酪速度: {character.cheesePushSpeed}</p>
                  )}
                  {character.wallCrackDamageBoost && (
                    <p className="text-blue-600 px-2 py-1">墙缝增伤: {character.wallCrackDamageBoost}%</p>
                  )}
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
                          {skill.type === 'ACTIVE' ? '主动技能 · ' :
                           skill.type === 'WEAPON1' ? '武器技能1 · ' :
                           skill.type === 'WEAPON2' ? '武器技能2 · ' : '被动技能 · '}
                          {skill.name}
                        </h3>
                      </div>

                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-2">
                        {/* Display CD information if any level has a cooldown */}
                        {skill.skillLevels.some(level => level.cooldown) && (
                          <span>
                            CD: {skill.skillLevels.map(level => level.cooldown || '-').join(' / ')} 秒
                          </span>
                        )}
                        {skill.canMoveWhileUsing && <span> · 移动释放</span>}
                        {skill.canUseInAir && <span> · 空中释放</span>}
                        {skill.cancelableSkill && <span> · {skill.cancelableSkill}</span>}
                        {skill.cancelableAftercast && <span> · {skill.cancelableAftercast}</span>}
                      </div>

                      <div className="mt-3 px-2">
                        {isDetailedView && skill.detailedDescription ? (
                          <p className="text-gray-700 py-2">{skill.detailedDescription}</p>
                        ) : (
                          skill.description && <p className="text-gray-700 py-2">{skill.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {skill.skillLevels.map((level) => (
                        <div key={`${skill.id}-${level.level}`} className="bg-gray-100 p-4 rounded">
                          <p className="px-2 py-1">
                            <span className="font-bold">Lv. {level.level}:</span> {level.description}
                          </p>
                          {/* Show detailed description if available and in detailed view */}
                          {isDetailedView && level.detailedDescription && (
                            <p className="text-sm mt-2 text-gray-600 px-2 py-1">{level.detailedDescription}</p>
                          )}
                          {/* Video button if available */}
                          {level.videoUrl && (
                            <button className="text-blue-600 text-sm mt-3 px-2 py-1 hover:underline">
                              查看技能视频
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
