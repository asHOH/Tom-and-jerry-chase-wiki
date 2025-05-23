'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { characters } from '@/data/mockData';

// This is a client component that uses the characters data from mockData.ts

export default function CharacterPage({ params }: { params: { characterId: string } }) {
  // Use the characters data from the mockData.ts file
  const character = characters[params.characterId];

  if (!character) {
    notFound();
  }

  // This is a static page that doesn't need the interactive navigation
  // The main app layout will handle the navigation
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3">
          <div className="card h-full">
            <div className="w-full h-64 bg-gray-200 rounded-lg relative overflow-hidden mb-4">
              {/* Character image */}
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
            <h1 className="text-3xl font-bold">{character.name}</h1>

            {/* Combined faction, name and description with proper spacing */}
            <p className="text-blue-600 mt-1">
              {character.faction.name} · {character.name} · {character.description}
            </p>

            {/* Character attributes section */}
            <div className="mt-4 space-y-2">
              {/* Common attributes for all characters */}
              <div className="grid grid-cols-2 gap-2">
                {character.maxHp && (
                  <p className="text-sm text-gray-700">Hp上限: {character.maxHp}</p>
                )}
                {character.attackBoost !== undefined && (
                  <p className="text-sm text-gray-700">攻击力加成: {character.attackBoost}</p>
                )}
                {character.hpRecovery && (
                  <p className="text-sm text-gray-700">Hp恢复: {character.hpRecovery} / 秒</p>
                )}
                {character.moveSpeed && (
                  <p className="text-sm text-gray-700">移动速度: {character.moveSpeed}</p>
                )}
                {character.jumpHeight && (
                  <p className="text-sm text-gray-700">跳跃高度: {character.jumpHeight}</p>
                )}
              </div>

              {/* Cat-specific attributes */}
              {character.faction.id === 'cat' && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  {character.clawKnifeCdHit && character.clawKnifeCdUnhit && (
                    <p className="text-amber-600">爪刀CD (未命中/命中): {character.clawKnifeCdUnhit} / {character.clawKnifeCdHit} 秒</p>
                  )}
                  {character.clawKnifeRange && (
                    <p className="text-amber-600">爪刀范围: {character.clawKnifeRange}</p>
                  )}
                </div>
              )}

              {/* Mouse-specific attributes */}
              {character.faction.id === 'mouse' && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  {character.cheesePushSpeed && (
                    <p className="text-blue-600">推奶酪速度: {character.cheesePushSpeed}</p>
                  )}
                  {character.wallCrackDamageBoost && (
                    <p className="text-blue-600">墙缝增伤: {character.wallCrackDamageBoost}%</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:w-2/3">
          <h2 className="text-2xl font-bold mb-4">技能</h2>
          <div className="space-y-6">
            {character.skills.map((skill) => (
              <div key={skill.id} className="card">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">
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

                    <div className="mt-2">
                      {skill.description && <p className="text-gray-700">{skill.description}</p>}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {skill.skillLevels.map((level) => (
                      <div key={`${skill.id}-${level.level}`} className="bg-gray-100 p-3 rounded">
                        <p>
                          <span className="font-bold">Lv. {level.level}:</span> {level.description}
                        </p>
                        {/* Video button if available */}
                        {level.videoUrl && (
                          <button className="text-blue-600 text-sm mt-2 hover:underline">
                            查看技能视频
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
