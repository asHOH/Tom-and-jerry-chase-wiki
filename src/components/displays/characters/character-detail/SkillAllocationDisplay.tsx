'use client';

import React, { useMemo, useCallback } from 'react';
import Image from '@/components/Image';
import { SkillAllocation, FactionId } from '@/data/types';
import {
  safeParseSkillAllocationPattern,
  validateSkillAllocationPattern,
  getSkillAllocationImageUrl,
  ParsedSkillLevel,
} from '@/lib/skillAllocationUtils';
import { getSkillLevelColors } from '@/lib/design-tokens';
import Tooltip from '../../../ui/Tooltip';
import { useEditMode, useLocalCharacter } from '@/context/EditModeContext';
import EditableField from '@/components/ui/EditableField';
import { useAppContext } from '@/context/AppContext';
import { useSnapshot } from 'valtio';
import { characters } from '@/data';
import { useDarkMode } from '@/context/DarkModeContext';
import clsx from 'clsx';
import TextWithHoverTooltips from '@/components/displays/characters/shared/TextWithHoverTooltips';

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
      const baseStyle = {
        ...colors,
      } as React.CSSProperties;

      const iconElement = (
        <div className={clsx('relative w-10 h-10', !isDelayed && 'rounded-full')} style={baseStyle}>
          <Image
            src={imageUrl}
            alt={skill?.name || `技能${skillType}`}
            width={40}
            height={40}
            className='w-full h-full object-contain'
            style={{ padding: '6px' }}
          />

          {showArc && (
            <svg
              className='absolute inset-0 pointer-events-none overflow-visible'
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
                    segments.push({ startDeg: 120 + HALF_SPLIT_DEG, endDeg: 240 - HALF_SPLIT_DEG });
                  }
                  if (currentLevel >= 3) {
                    segments.push({ startDeg: 240 + HALF_SPLIT_DEG, endDeg: 360 - HALF_SPLIT_DEG });
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
          )}

          {hasNegativeEffect && (
            <div className='absolute -top-[5px] -right-[5px] w-4 h-4 pointer-events-none z-10'>
              <Image
                src='/images/misc/禁止.png'
                alt='负面效果'
                width={16}
                height={16}
                className='w-full h-full object-contain'
                priority={false} // Lower priority for overlay icons
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
          <div className='absolute left-10 top-3 w-4 h-auto'>
            <div className='w-full h-px bg-gray-400 dark:bg-gray-600'></div>
            <div className='w-full h-px bg-gray-400 dark:bg-gray-600 mt-7'></div>
          </div>
        );
      } else if (isLastLevelInGroup && nextGroup?.isParallelGroup) {
        // Parallel to parallel (different groups) -> converge then diverge
        return (
          <div className='absolute left-7 top-3 w-10 h-7'>
            <svg className='w-full h-full overflow-visible' viewBox='0 0 40 28'>
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
          <div className='absolute left-10 top-3 w-4 h-7'>
            <svg className='w-full h-full' viewBox='0 0 16 28'>
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
          <div className='absolute left-8 top-[7px] w-4 h-7 [transform:scaleX(-1)]'>
            <svg className='w-full h-full' viewBox='0 0 16 28'>
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
        return <div className='absolute left-10 top-5 w-4 h-px bg-gray-400 dark:bg-gray-600'></div>;
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
        <div className='w-1/6 flex-shrink-0 flex flex-col'>
          {isEditMode ? (
            <EditableField
              tag='h4'
              path={`skillAllocations.${index}.id`}
              initialValue={allocation.id}
              className='font-bold text-gray-800 dark:text-gray-200 text-lg leading-tight'
            />
          ) : (
            <h4 className='font-bold text-gray-800 dark:text-gray-200 text-lg leading-tight'>
              {allocation.id}
            </h4>
          )}
          {isEditMode && (
            <EditableField
              tag='p'
              path={`skillAllocations.${index}.pattern`}
              initialValue={allocation.pattern}
              className='text-gray-500 dark:text-gray-400 text-sm'
              data-tutorial-id='skill-allocation-edit'
            />
          )}
        </div>
        <div className='flex-1'>
          {/* Show validation errors if pattern is invalid */}
          {!patternValidation.isValid && (
            <div className='mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg'>
              <div className='flex items-start gap-2'>
                <div className='flex-shrink-0 w-5 h-5 mt-0.5'>
                  <svg
                    className='w-5 h-5 text-red-500 dark:text-red-400'
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
                  <h4 className='text-sm font-medium text-red-800 dark:text-red-200 mb-1'>
                    加点方案格式错误
                  </h4>
                  <div className='text-sm text-red-700 dark:text-red-300 space-y-1'>
                    {patternValidation.errors.map((error, errorIndex) => (
                      <div key={errorIndex}>{error.message}</div>
                    ))}
                  </div>
                  {patternValidation.warnings.length > 0 && (
                    <div className='mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1'>
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
            <div className='flex flex-wrap items-start gap-2 gap-y-6 md:gap-y-4 mb-2'>
              {levelGroups.map((group, groupIndex) => (
                <div key={groupIndex} className='relative flex flex-col items-center'>
                  {group.isParallelGroup ? (
                    <>
                      <div className='flex gap-1 justify-center mb-3 h-4'>
                        {group.levels.map((level, levelIndex) => (
                          <div key={levelIndex} className='w-10 flex flex-col items-center'>
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
                      <div className='relative h-12 flex gap-1 justify-center'>
                        {group.levels.map((level, levelIndex) => (
                          <div
                            key={levelIndex}
                            className='relative w-10 flex flex-col justify-center'
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
                      <span className='text-xs text-gray-500 dark:text-gray-400 mb-4 h-4'>
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
              <div className='text-center text-gray-500 dark:text-gray-400 py-4'>
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
              className='w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-md text-xs hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='2'
                stroke='currentColor'
                className='w-4 h-4'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m-1.022.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.924a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165M12 2.252V5.25m0 0A2.25 2.25 0 0114.25 7.5h2.25M12 2.252V5.25m0 0A2.25 2.25 0 009.75 7.5H7.5'
                />
              </svg>
            </button>
          </div>
        )}
      </div>
      {shouldShowDescriptionBlock && (
        <div className='bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg'>
          {isEditMode ? (
            <EditableField
              tag='p'
              path={`skillAllocations.${index}.description`}
              initialValue={allocation.description!}
              className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'
            />
          ) : (
            hasDescription && (
              <p className='text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap'>
                <TextWithHoverTooltips text={allocation.description!} />
              </p>
            )
          )}
          {hasAdditionalDescription && (
            <EditableField
              tag='p'
              path={`skillAllocations.${index}.additionaldescription`}
              initialValue={allocation.additionaldescription!}
              className='text-sm text-gray-600 dark:text-gray-400 mt-2 pl-3 border-l-2 border-blue-200 dark:border-blue-700 whitespace-pre-wrap'
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SkillAllocationDisplay;
