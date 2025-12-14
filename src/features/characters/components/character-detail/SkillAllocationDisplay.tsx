'use client';

import React, { useCallback, useMemo } from 'react';
import clsx from 'clsx';
import { useSnapshot } from 'valtio';

import { getSkillLevelColors } from '@/lib/design-tokens';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import { FactionId, SkillAllocation } from '@/data/types';
import TextWithHoverTooltips from '@/features/characters/components/shared/TextWithHoverTooltips';
import {
  getSkillAllocationImageUrl,
  ParsedSkillLevel,
  safeParseSkillAllocationPattern,
  validateSkillAllocationPattern,
} from '@/features/characters/utils/skillAllocation';
import EditableField from '@/components/ui/EditableField';
import Tooltip from '@/components/ui/Tooltip';
import { TrashIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import { characters } from '@/data';

// Type for processed skill levels with current level information
type ProcessedSkillLevel = ParsedSkillLevel & {
  currentLevel: number;
  parallelCurrentLevel?: number; // Only present for parallel skills
};

interface SkillAllocationDisplayProps {
  allocation: SkillAllocation;
  factionId: FactionId;
  onRemove: (allocationId: string) => void;
  index: number;
}

const SkillAllocationDisplay: React.FC<SkillAllocationDisplayProps> = ({
  allocation,
  factionId,
  onRemove,
  index,
}) => {
  const { isEditMode } = useEditMode();

  // Memoize pattern preprocessing to avoid recalculation
  const processedPattern = useMemo(() => {
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

    return preprocessPattern(allocation.pattern);
  }, [allocation.pattern]);

  // Memoize pattern validation and parsing
  const patternValidation = useMemo(() => {
    return validateSkillAllocationPattern(processedPattern);
  }, [processedPattern]);

  // Memoize parsed levels to avoid recalculation
  const parsedLevels = useMemo(() => {
    if (!patternValidation.isValid) {
      return [];
    }
    return safeParseSkillAllocationPattern(processedPattern) || [];
  }, [processedPattern, patternValidation.isValid]);

  // Memoize current levels calculation for performance
  const currentLevels: ProcessedSkillLevel[] = useMemo(() => {
    const skillLevels = { '0': 0, '1': 0, '2': 0, '3': 0 };

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
      } else {
        skillLevels[level.skillTypeNum]++;
        return { ...level, currentLevel: skillLevels[level.skillTypeNum] };
      }
    });
  }, [parsedLevels]);

  const { characterId } = useLocalCharacter();
  const characterSkills = useSnapshot(characters[characterId]!.skills);
  const characterName = useSnapshot(characters[characterId]!).id;
  const [isDarkMode] = useDarkMode();

  // Memoize skill type mapping for performance
  const skillTypeMap = useMemo(
    () => ({
      '0': characterSkills.find((s) => s.type === 'passive'),
      '1': characterSkills.find((s) => s.type === 'active'),
      '2': characterSkills.find((s) => s.type === 'weapon1'),
      '3': characterSkills.find((s) => s.type === 'weapon2'),
    }),
    [characterSkills]
  ); // Memoize skill icon renderer for performance
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

      // Compute colors and edge styles. For lv1/2, we render a partial circular arc instead of a full border.
      type SkillLevelColors = { color: string; backgroundColor: string; borderColor?: string };
      const colors: SkillLevelColors = getSkillLevelColors(currentLevel, true, isDarkMode);
      const edgeColor = (colors?.borderColor as string) ?? '#9ca3af';
      const showArc = currentLevel === 1 || currentLevel === 2 || currentLevel === 3;
      const delayedBgInset = 2; // shrink background for delayed skills to better match circle
      const baseStyle = {
        ...colors,
        padding: isDelayed ? delayedBgInset : undefined,
        // Only color the content box so the padding acts as visual inset around the background
        backgroundClip: isDelayed
          ? ('content-box' as React.CSSProperties['backgroundClip'])
          : undefined,
      } as React.CSSProperties;

      const iconElement = (
        <div className={clsx('relative h-10 w-10', !isDelayed && 'rounded-full')} style={baseStyle}>
          <Image
            src={imageUrl}
            alt={skill?.name || `技能${skillType}`}
            width={34}
            height={34}
            className='h-full w-full object-contain p-1.5'
          />

          {showArc &&
            (isDelayed ? (
              // Square-style 3-segment edge for 留加点 (delayed) skills
              // Starts at top-middle and each level covers 1/3 of total perimeter
              <svg
                className='pointer-events-none absolute inset-0 overflow-visible'
                viewBox='0 0 40 40'
                width={40}
                height={40}
              >
                {(() => {
                  const strokeWidth = 2; // edge thickness
                  const size = 40;
                  const inset = strokeWidth / 2 + delayedBgInset; // keep stroke fully inside the box
                  const left = inset;
                  const right = size - inset;
                  const top = inset;
                  const bottom = size - inset;
                  const L = right - left; // usable edge length per side
                  const P = 4 * L; // total perimeter
                  const segLen = P / 3; // each level covers exactly 1/3
                  const splitGap = 3.5; // visual split at segment boundaries (total), half on each side

                  // Map distance s (from top-middle, clockwise) to a point on the square perimeter
                  const getPoint = (s: number) => {
                    // normalize to [0, P)
                    let sn = s % P;
                    if (sn < 0) sn += P;
                    const halfTop = L / 2; // length from top-middle to top-right
                    if (sn < halfTop) {
                      // top edge: middle -> right
                      return { x: left + L / 2 + sn, y: top };
                    }
                    sn -= halfTop;
                    if (sn < L) {
                      // right edge: top -> bottom
                      return { x: right, y: top + sn };
                    }
                    sn -= L;
                    if (sn < L) {
                      // bottom edge: right -> left
                      return { x: right - sn, y: bottom };
                    }
                    sn -= L;
                    if (sn < L) {
                      // left edge: bottom -> top
                      return { x: left, y: bottom - sn };
                    }
                    sn -= L;
                    // top edge: left -> middle
                    return { x: left + sn, y: top };
                  };

                  // Convert [s1, s2] arc along perimeter into a path string that crosses corners cleanly
                  const segmentToPath = (s1: number, s2: number) => {
                    const boundaries = [
                      L / 2, // top-middle -> top-right
                      L / 2 + L, // right-bottom corner
                      L / 2 + 2 * L, // bottom-left corner
                      L / 2 + 3 * L, // left-top corner
                      L / 2 + 4 * L, // back to top-middle (P)
                    ];

                    let d = '';
                    let curS = s1;
                    const start = getPoint(curS);
                    d += `M ${start.x} ${start.y}`;

                    while (curS < s2) {
                      const base = Math.floor(curS / P) * P;
                      const pos = curS - base; // pos in [0, P)
                      // find next boundary strictly greater than pos
                      let nextB = P; // default wraps to end
                      for (let i = 0; i < boundaries.length; i++) {
                        const b = boundaries[i];
                        if (b !== undefined && b > pos) {
                          nextB = b;
                          break;
                        }
                      }
                      let nextS = base + nextB; // absolute s at boundary
                      if (nextS > s2) nextS = s2;
                      const pt = getPoint(nextS);
                      d += ` L ${pt.x} ${pt.y}`;
                      curS = nextS;
                    }
                    return d;
                  };

                  const paths: React.ReactNode[] = [];
                  const drawnCount = Math.min(3, currentLevel);
                  for (let i = 0; i < drawnCount; i++) {
                    const base = i * segLen;
                    const s1 = base + splitGap / 2;
                    const s2 = base + segLen - splitGap / 2;
                    const d = segmentToPath(s1, s2);
                    const isLast = i === drawnCount - 1;
                    paths.push(
                      <path
                        key={i}
                        d={d}
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
              // Circular 3-segment edge for normal skills
              <svg
                className='pointer-events-none absolute inset-0 overflow-visible'
                viewBox='0 0 40 40'
                width={40}
                height={40}
              >
                {/* Rotate -90deg so the arc starts at 12 o'clock */}
                <g transform='rotate(-90 20 20)'>
                  {(() => {
                    const strokeWidth = 2; // thickness of the edge
                    const r = 20 - strokeWidth / 2; // keep stroke inside the 40x40 box
                    const circumference = 2 * Math.PI * r;
                    const HALF_SPLIT_DEG = 5; // half the split degree

                    // Build cumulative segments per level
                    const segments: Array<{ startDeg: number; endDeg: number }> = [];
                    if (currentLevel >= 1) {
                      segments.push({ startDeg: 0 + HALF_SPLIT_DEG, endDeg: 120 - HALF_SPLIT_DEG });
                    }
                    if (currentLevel >= 2) {
                      segments.push({
                        startDeg: 120 + HALF_SPLIT_DEG,
                        endDeg: 240 - HALF_SPLIT_DEG,
                      });
                    }
                    if (currentLevel >= 3) {
                      segments.push({
                        startDeg: 240 + HALF_SPLIT_DEG,
                        endDeg: 360 - HALF_SPLIT_DEG,
                      });
                    }

                    return segments.map(({ startDeg, endDeg }, idx) => {
                      const segDeg = Math.max(0, endDeg - startDeg);
                      const dash = (segDeg / 360) * circumference;
                      const gap = Math.max(0, circumference - dash);
                      const offset = -(startDeg / 360) * circumference;
                      return (
                        <circle
                          key={idx}
                          cx='20'
                          cy='20'
                          r={r}
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
            <div className='pointer-events-none absolute -top-[5px] -right-[5px] z-10 h-4 w-4'>
              <Image
                src='/images/misc/禁止.png'
                alt='负面效果'
                width={16}
                height={16}
                className='h-full w-full object-contain'
                preload={false} // Lower priority for overlay icons
              />
            </div>
          )}
        </div>
      );

      if (isDelayed)
        return (
          <span className='inline-block'>
            <Tooltip content='留加点：此技能加点需把握时机，因为加点瞬间有额外收益，或需要根据战局调整加点顺序'>
              {iconElement}
            </Tooltip>
          </span>
        );
      if (hasNegativeEffect)
        return (
          <span className='inline-block'>
            <Tooltip content='负面效果：此技能不建议升级，因为升级效果有好有坏或完全是负面效果'>
              {iconElement}
            </Tooltip>
          </span>
        );
      return iconElement;
    },
    [skillTypeMap, characterName, factionId, isDarkMode]
  );

  // Memoize level groups calculation for performance
  const levelGroups = useMemo(() => {
    // Calculate character levels and group parallel skills
    let characterLevel = 2;
    const groups: Array<{
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
        groups.push({
          characterLevel,
          endCharacterLevel: characterLevel + parallelLevels.length * 2 - 1,
          levels: parallelLevels,
          isParallelGroup: true,
        });
        characterLevel += parallelLevels.length * 2;
        i = j;
      } else {
        groups.push({ characterLevel, levels: [level], isParallelGroup: false });
        characterLevel++;
        i++;
      }
    }
    return groups;
  }, [currentLevels]);

  // Helper function to render connection lines
  const renderConnectionLine = (
    groupIndex: number,
    levelIndex: number,
    group: (typeof levelGroups)[0],
    isParallel: boolean
  ) => {
    const DELAYED_INSET = 2; // keep in sync with delayedBgInset used in icon rendering
    const sourceIsDelayed = isParallel
      ? Boolean(group.levels[levelIndex]?.isDelayed)
      : Boolean(group.levels[0]?.isDelayed);
    const startAdjustStyle = sourceIsDelayed ? { marginLeft: -DELAYED_INSET } : undefined;
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
          <div className='absolute top-3 left-10 h-auto w-4' style={startAdjustStyle}>
            <div className='h-px w-full bg-gray-400 dark:bg-gray-600'></div>
            <div className='mt-7 h-px w-full bg-gray-400 dark:bg-gray-600'></div>
          </div>
        );
      } else if (isLastLevelInGroup && nextGroup?.isParallelGroup) {
        // Parallel to parallel (different groups) -> converge then diverge
        return (
          <div className='absolute top-3 left-7 h-7 w-10' style={startAdjustStyle}>
            <svg className='h-full w-full overflow-visible' viewBox='0 0 40 28'>
              {/* Converging lines from current group */}
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
              {/* Diverging lines to next group - more visible curves */}
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
      } else if (isLastLevelInGroup && nextGroup) {
        // Parallel to single -> converge
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
        // Single to parallel -> diverge
        return (
          // The top-[7px] value centers the divergence point vertically with the single 40px icon.
          <div
            className='absolute top-[7px] left-8 h-7 w-4 [transform:scaleX(-1)]'
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
      } else {
        // Single to single -> straight line
        return (
          <div
            className='absolute top-5 left-10 h-px w-4 bg-gray-400 dark:bg-gray-600'
            style={startAdjustStyle}
          ></div>
        );
      }
    }
    return null;
  };

  const { isDetailedView: isDetailed } = useAppContext();

  const hasDescription = allocation.description?.trim();
  const hasAdditionalDescription = isDetailed && allocation.additionaldescription?.trim();
  const shouldShowDescriptionBlock = hasDescription || hasAdditionalDescription;

  return (
    <div className='space-y-3'>
      <div className='flex gap-4'>
        <div className='flex w-1/6 flex-shrink-0 flex-col'>
          {isEditMode ? (
            <EditableField
              tag='h4'
              path={`skillAllocations.${index}.id`}
              initialValue={allocation.id}
              className='text-lg leading-tight font-bold text-gray-800 dark:text-gray-200'
            />
          ) : (
            <h4 className='text-lg leading-tight font-bold text-gray-800 dark:text-gray-200'>
              {allocation.id}
            </h4>
          )}
          {isEditMode && (
            <EditableField
              tag='p'
              path={`skillAllocations.${index}.pattern`}
              initialValue={allocation.pattern}
              className='text-sm text-gray-500 dark:text-gray-400'
              data-tutorial-id='skill-allocation-edit'
            />
          )}
        </div>
        <div className='flex-1'>
          {/* Show validation errors if pattern is invalid */}
          {!patternValidation.isValid && (
            <div className='mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
              <div className='flex items-start gap-2'>
                <div className='mt-0.5 h-5 w-5 flex-shrink-0'>
                  <svg
                    className='h-5 w-5 text-red-500 dark:text-red-400'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                  >
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <div className='flex-1'>
                  <h4 className='mb-1 text-sm font-medium text-red-800 dark:text-red-200'>
                    加点方案格式错误
                  </h4>
                  <div className='space-y-1 text-sm text-red-700 dark:text-red-300'>
                    {patternValidation.errors.map((error, errorIndex) => (
                      <div key={errorIndex}>{error.message}</div>
                    ))}
                  </div>
                  {patternValidation.warnings.length > 0 && (
                    <div className='mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300'>
                      {patternValidation.warnings.map((warning, warningIndex) => (
                        <div key={warningIndex}>⚠️ {warning.message}</div>
                      ))}
                    </div>
                  )}
                  <div className='mt-2 text-xs text-red-600 dark:text-red-400'>
                    格式说明：0=被动，1=主动，2=武器1，3=武器2，[12]=并行加点，(0)=留加点，-1=负面效果
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Show parsed skill allocation or fallback message */}
          {patternValidation.isValid && levelGroups.length > 0 ? (
            <div className='mb-2 flex flex-wrap items-start gap-2 gap-y-6 md:gap-y-4'>
              {levelGroups.map((group, groupIndex) => (
                <div key={groupIndex} className='relative flex flex-col items-center'>
                  {group.isParallelGroup ? (
                    <>
                      <div className='mb-3 flex h-4 justify-center gap-1'>
                        {group.levels.map((level, levelIndex) => (
                          <div key={levelIndex} className='flex w-10 flex-col items-center'>
                            <span className='text-xs text-gray-500 dark:text-gray-400'>
                              {
                                !level.hasNegativeEffect
                                  ? `Lv.${group.characterLevel + levelIndex}/${group.characterLevel + levelIndex + group.levels.length}`
                                  : '\u00A0' // Non-breaking space for alignment
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className='relative flex h-12 justify-center gap-1'>
                        {group.levels.map((level, levelIndex) => (
                          <div
                            key={levelIndex}
                            className='relative flex w-10 flex-col justify-center'
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
                      <span className='mb-4 h-4 text-xs text-gray-500 dark:text-gray-400'>
                        {
                          !group.levels[0]!.hasNegativeEffect
                            ? `Lv.${group.characterLevel}`
                            : '\u00A0' // Non-breaking space for alignment
                        }
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
          ) : (
            !patternValidation.isValid && (
              <div className='py-4 text-center text-gray-500 dark:text-gray-400'>
                无法显示加点方案，请检查格式
              </div>
            )
          )}
        </div>
        {isEditMode && (
          <div className='flex flex-col gap-2'>
            <button
              type='button'
              aria-label='移除技能加点'
              onClick={() => onRemove(allocation.id)}
              className='flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-xs text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            >
              <TrashIcon className='h-4 w-4' aria-hidden='true' />
            </button>
          </div>
        )}
      </div>
      {shouldShowDescriptionBlock && (
        <div className='rounded-lg bg-gray-50 p-3 dark:bg-slate-800/50'>
          {isEditMode ? (
            <EditableField
              tag='p'
              path={`skillAllocations.${index}.description`}
              initialValue={allocation.description!}
              className='text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300'
            />
          ) : (
            hasDescription && (
              <p className='text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300'>
                <TextWithHoverTooltips text={allocation.description!} />
              </p>
            )
          )}
          {hasAdditionalDescription && (
            <EditableField
              tag='p'
              path={`skillAllocations.${index}.additionaldescription`}
              initialValue={allocation.additionaldescription!}
              className='mt-2 border-l-2 border-blue-200 pl-3 text-sm whitespace-pre-wrap text-gray-600 dark:border-blue-700 dark:text-gray-400'
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SkillAllocationDisplay;
