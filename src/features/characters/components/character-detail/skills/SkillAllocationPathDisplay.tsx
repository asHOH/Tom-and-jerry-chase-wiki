'use client';

import React, { useCallback, useMemo } from 'react';

import type { DeepReadonly } from '@/types/deep-readonly';
import { cn, getSkillLevelColors } from '@/lib/design';
import type { FactionId, SkillDefinition } from '@/data/types';
import {
  getSkillAllocationImageUrl,
  type ParsedSkillLevel,
} from '@/features/characters/utils/skillAllocation';
import Tooltip from '@/components/ui/Tooltip';
import Image from '@/components/Image';

type ProcessedSkillLevel = ParsedSkillLevel & {
  currentLevel: number;
  parallelCurrentLevel?: number;
};

type SkillAllocationLevelGroup = {
  characterLevel: number;
  endCharacterLevel?: number;
  levels: ProcessedSkillLevel[];
  isParallelGroup: boolean;
};

type SkillAllocationPathDisplayProps = {
  parsedLevels: ParsedSkillLevel[];
  characterSkills: DeepReadonly<SkillDefinition[]>;
  characterName: string;
  factionId: FactionId;
  isDarkMode: boolean;
};

const DELAYED_BG_INSET = 2;

const buildCurrentLevels = (parsedLevels: ParsedSkillLevel[]): ProcessedSkillLevel[] => {
  const skillLevels: Record<ParsedSkillLevel['skillTypeNum'], number> = {
    '0': 0,
    '1': 0,
    '2': 0,
    '3': 0,
  };

  return parsedLevels.map((level) => {
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
    }

    skillLevels[level.skillTypeNum]++;
    return { ...level, currentLevel: skillLevels[level.skillTypeNum] };
  });
};

const buildLevelGroups = (currentLevels: ProcessedSkillLevel[]): SkillAllocationLevelGroup[] => {
  let characterLevel = 2;
  const groups: SkillAllocationLevelGroup[] = [];
  let index = 0;

  while (index < currentLevels.length) {
    const level = currentLevels[index]!;

    if (level.isParallel && level.parallelOptions) {
      const currentBracketGroupId = level.bracketGroupId;
      let endIndex = index;
      while (
        endIndex < currentLevels.length &&
        currentLevels[endIndex]?.isParallel &&
        currentLevels[endIndex]?.bracketGroupId === currentBracketGroupId
      ) {
        endIndex++;
      }

      const parallelLevels = currentLevels.slice(index, endIndex);
      groups.push({
        characterLevel,
        endCharacterLevel: characterLevel + parallelLevels.length * 2 - 1,
        levels: parallelLevels,
        isParallelGroup: true,
      });
      characterLevel += parallelLevels.length * 2;
      index = endIndex;
    } else {
      groups.push({ characterLevel, levels: [level], isParallelGroup: false });
      characterLevel++;
      index++;
    }
  }

  return groups;
};

export default function SkillAllocationPathDisplay({
  parsedLevels,
  characterSkills,
  characterName,
  factionId,
  isDarkMode,
}: SkillAllocationPathDisplayProps) {
  const currentLevels = useMemo(() => buildCurrentLevels(parsedLevels), [parsedLevels]);
  const levelGroups = useMemo(() => buildLevelGroups(currentLevels), [currentLevels]);

  const skillTypeMap = useMemo(
    () => ({
      '0': characterSkills.find((skill) => skill.type === 'passive'),
      '1': characterSkills.find((skill) => skill.type === 'active'),
      '2': characterSkills.find((skill) => skill.type === 'weapon1'),
      '3': characterSkills.find((skill) => skill.type === 'weapon2'),
    }),
    [characterSkills]
  );

  const renderSkillIcon = useCallback(
    (
      skillType: '0' | '1' | '2' | '3',
      currentLevel: number,
      isDelayed: boolean,
      hasNegativeEffect: boolean
    ) => {
      const skill = skillTypeMap[skillType];
      const imageUrl =
        skill?.imageUrl ||
        getSkillAllocationImageUrl(characterName, skillType, factionId, skill?.name);

      type SkillLevelColors = { color: string; backgroundColor: string; borderColor?: string };
      const colors: SkillLevelColors = getSkillLevelColors(currentLevel, true, isDarkMode);
      const edgeColor = (colors?.borderColor as string) ?? '#9ca3af';
      const showArc = currentLevel === 1 || currentLevel === 2 || currentLevel === 3;
      const baseStyle = {
        ...colors,
        padding: isDelayed ? DELAYED_BG_INSET : undefined,
        backgroundClip: isDelayed
          ? ('content-box' as React.CSSProperties['backgroundClip'])
          : undefined,
      } as React.CSSProperties;

      const iconElement = (
        <div className={cn('relative h-10 w-10', !isDelayed && 'rounded-full')} style={baseStyle}>
          <Image
            src={imageUrl}
            alt={skill?.name || `技能${skillType}`}
            width={34}
            height={34}
            className='h-full w-full object-contain p-1.5'
          />

          {showArc &&
            (isDelayed ? (
              <svg
                className='pointer-events-none absolute inset-0 overflow-visible'
                viewBox='0 0 40 40'
                width={40}
                height={40}
              >
                {(() => {
                  const strokeWidth = 2;
                  const size = 40;
                  const inset = strokeWidth / 2 + DELAYED_BG_INSET;
                  const left = inset;
                  const right = size - inset;
                  const top = inset;
                  const bottom = size - inset;
                  const length = right - left;
                  const perimeter = 4 * length;
                  const segmentLength = perimeter / 3;
                  const splitGap = 3.5;

                  const getPoint = (position: number) => {
                    let normalizedPosition = position % perimeter;
                    if (normalizedPosition < 0) normalizedPosition += perimeter;
                    const halfTop = length / 2;
                    if (normalizedPosition < halfTop) {
                      return { x: left + length / 2 + normalizedPosition, y: top };
                    }
                    normalizedPosition -= halfTop;
                    if (normalizedPosition < length) {
                      return { x: right, y: top + normalizedPosition };
                    }
                    normalizedPosition -= length;
                    if (normalizedPosition < length) {
                      return { x: right - normalizedPosition, y: bottom };
                    }
                    normalizedPosition -= length;
                    if (normalizedPosition < length) {
                      return { x: left, y: bottom - normalizedPosition };
                    }
                    normalizedPosition -= length;
                    return { x: left + normalizedPosition, y: top };
                  };

                  const segmentToPath = (startPosition: number, endPosition: number) => {
                    const boundaries = [
                      length / 2,
                      length / 2 + length,
                      length / 2 + 2 * length,
                      length / 2 + 3 * length,
                      length / 2 + 4 * length,
                    ];

                    let path = '';
                    let currentPosition = startPosition;
                    const start = getPoint(currentPosition);
                    path += `M ${start.x} ${start.y}`;

                    while (currentPosition < endPosition) {
                      const base = Math.floor(currentPosition / perimeter) * perimeter;
                      const position = currentPosition - base;
                      let nextBoundary = perimeter;
                      for (let i = 0; i < boundaries.length; i++) {
                        const boundary = boundaries[i];
                        if (boundary !== undefined && boundary > position) {
                          nextBoundary = boundary;
                          break;
                        }
                      }
                      let nextPosition = base + nextBoundary;
                      if (nextPosition > endPosition) nextPosition = endPosition;
                      const point = getPoint(nextPosition);
                      path += ` L ${point.x} ${point.y}`;
                      currentPosition = nextPosition;
                    }
                    return path;
                  };

                  const paths: React.ReactNode[] = [];
                  const drawnCount = Math.min(3, currentLevel);
                  for (let i = 0; i < drawnCount; i++) {
                    const base = i * segmentLength;
                    const startPosition = base + splitGap / 2;
                    const endPosition = base + segmentLength - splitGap / 2;
                    const path = segmentToPath(startPosition, endPosition);
                    const isLast = i === drawnCount - 1;
                    paths.push(
                      <path
                        key={i}
                        d={path}
                        fill='none'
                        stroke={edgeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap='round'
                        strokeDasharray={isLast ? '1 4' : undefined}
                        shapeRendering='geometricPrecision'
                      />
                    );
                  }
                  return paths;
                })()}
              </svg>
            ) : (
              <svg
                className='pointer-events-none absolute inset-0 overflow-visible'
                viewBox='0 0 40 40'
                width={40}
                height={40}
              >
                <g transform='rotate(-90 20 20)'>
                  {(() => {
                    const strokeWidth = 2;
                    const radius = 20 - strokeWidth / 2;
                    const circumference = 2 * Math.PI * radius;
                    const halfSplitDegree = 5;

                    const segments: Array<{ startDegree: number; endDegree: number }> = [];
                    if (currentLevel >= 1) {
                      segments.push({
                        startDegree: 0 + halfSplitDegree,
                        endDegree: 120 - halfSplitDegree,
                      });
                    }
                    if (currentLevel >= 2) {
                      segments.push({
                        startDegree: 120 + halfSplitDegree,
                        endDegree: 240 - halfSplitDegree,
                      });
                    }
                    if (currentLevel >= 3) {
                      segments.push({
                        startDegree: 240 + halfSplitDegree,
                        endDegree: 360 - halfSplitDegree,
                      });
                    }

                    return segments.map(({ startDegree, endDegree }, idx) => {
                      const segmentDegree = Math.max(0, endDegree - startDegree);
                      const dash = (segmentDegree / 360) * circumference;
                      const gap = Math.max(0, circumference - dash);
                      const offset = -(startDegree / 360) * circumference;
                      return (
                        <circle
                          key={idx}
                          cx='20'
                          cy='20'
                          r={radius}
                          fill='none'
                          stroke={edgeColor}
                          strokeWidth={strokeWidth}
                          strokeLinecap='round'
                          shapeRendering='geometricPrecision'
                          strokeDasharray={`${dash} ${gap}`}
                          strokeDashoffset={offset}
                        />
                      );
                    });
                  })()}
                </g>
              </svg>
            ))}

          {hasNegativeEffect && (
            <div className='pointer-events-none absolute -top-1.25 -right-1.25 z-10 h-4 w-4'>
              <Image
                src='/images/misc/禁止.png'
                alt='负面效果'
                width={16}
                height={16}
                className='h-full w-full object-contain'
                preload={false}
              />
            </div>
          )}
        </div>
      );

      if (isDelayed) {
        return (
          <span className='inline-block'>
            <Tooltip content='留加点：此技能加点需把握时机，因为加点瞬间有额外收益，或需要根据战局调整加点顺序'>
              {iconElement}
            </Tooltip>
          </span>
        );
      }

      if (hasNegativeEffect) {
        return (
          <span className='inline-block'>
            <Tooltip content='负面效果：此技能不建议升级，因为升级效果有好有坏或完全是负面效果'>
              {iconElement}
            </Tooltip>
          </span>
        );
      }

      return iconElement;
    },
    [skillTypeMap, characterName, factionId, isDarkMode]
  );

  const renderConnectionLine = (
    groupIndex: number,
    levelIndex: number,
    group: SkillAllocationLevelGroup,
    isParallel: boolean
  ) => {
    const sourceIsDelayed = isParallel
      ? Boolean(group.levels[levelIndex]?.isDelayed)
      : Boolean(group.levels[0]?.isDelayed);
    const startAdjustStyle = sourceIsDelayed ? { marginLeft: -DELAYED_BG_INSET } : undefined;
    const isLastLevelInGroup = levelIndex === group.levels.length - 1;
    const nextGroup =
      groupIndex < levelGroups.length - 1 ? (levelGroups[groupIndex + 1] ?? null) : null;

    if (group.levels[levelIndex]?.hasNegativeEffect) return null;

    const checkNextForNegative = (next: SkillAllocationLevelGroup | null) => {
      if (!next) return false;
      if (next.isParallelGroup) return next.levels.some((level) => level.hasNegativeEffect);
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
        return (
          <div className='absolute top-3 left-10 h-auto w-4' style={startAdjustStyle}>
            <div className='h-px w-full bg-gray-400 dark:bg-gray-600'></div>
            <div className='mt-7 h-px w-full bg-gray-400 dark:bg-gray-600'></div>
          </div>
        );
      }

      if (nextGroup?.isParallelGroup) {
        return (
          <div className='absolute top-3 left-7 h-7 w-10' style={startAdjustStyle}>
            <svg className='h-full w-full overflow-visible' viewBox='0 0 40 28'>
              <path
                d='M11 0 Q16.5 4 16 14'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
              <path
                d='M11 28 Q16.5 24 16 14'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
              <path
                d='M16 14 Q15.5 4 21 0'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
              <path
                d='M16 14 Q15.5 24 21 28'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
            </svg>
          </div>
        );
      }

      if (nextGroup) {
        return (
          <div className='absolute top-3 left-10 h-7 w-4' style={startAdjustStyle}>
            <svg className='h-full w-full' viewBox='0 0 16 28'>
              <path
                d='M0 0 Q8 0 16 14'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
              <path
                d='M0 28 Q8 28 16 14'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
            </svg>
          </div>
        );
      }
    } else if (nextGroup) {
      if (nextGroup.isParallelGroup) {
        return (
          <div
            className='absolute top-1.75 left-8 h-7 w-4 transform-[scaleX(-1)]'
            style={startAdjustStyle}
          >
            <svg className='h-full w-full' viewBox='0 0 16 28'>
              <path
                d='M0 1 Q8 1 16 14'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
              <path
                d='M0 28 Q8 28 16 14'
                fill='none'
                stroke='#9ca3af'
                strokeWidth='1'
                className='dark:stroke-gray-600'
              />
            </svg>
          </div>
        );
      }

      return (
        <div
          className='absolute top-5 left-10 h-px w-4 bg-gray-400 dark:bg-gray-600'
          style={startAdjustStyle}
        ></div>
      );
    }

    return null;
  };

  if (levelGroups.length === 0) {
    return null;
  }

  return (
    <div className='mb-2 flex flex-wrap items-start gap-2 gap-y-6 md:gap-y-4'>
      {levelGroups.map((group, groupIndex) => (
        <div key={groupIndex} className='relative flex flex-col items-center'>
          {group.isParallelGroup ? (
            <>
              <div className='mb-3 flex h-4 justify-center gap-1'>
                {group.levels.map((level, levelIndex) => (
                  <div key={levelIndex} className='flex w-10 flex-col items-center'>
                    <span className='text-xs text-gray-500 dark:text-gray-400'>
                      {!level.hasNegativeEffect
                        ? `Lv.${group.characterLevel + levelIndex}/${group.characterLevel + levelIndex + group.levels.length}`
                        : '\u00A0'}
                    </span>
                  </div>
                ))}
              </div>
              <div className='relative flex h-12 justify-center gap-1'>
                {group.levels.map((level, levelIndex) => (
                  <div key={levelIndex} className='relative flex w-10 flex-col justify-center'>
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
              <span className='mb-4 h-4 text-xs text-gray-500 dark:text-gray-400'>
                {!group.levels[0]!.hasNegativeEffect ? `Lv.${group.characterLevel}` : '\u00A0'}
              </span>
              <div className='relative'>
                {renderConnectionLine(groupIndex, 0, group, false)}
                {renderSkillIcon(
                  group.levels[0]!.skillTypeNum,
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
  );
}
