'use client';

import React, { useMemo } from 'react';

import { useActiveEditRuntime, useOptionalEditSnapshot } from '@/lib/edit/activeEditRuntime';
import { useLocalCharacter } from '@/hooks/useLocalEditEntity';
import { useAppContext } from '@/context/AppContext';
import { useDarkMode } from '@/context/DarkModeContext';
import { useEditMode } from '@/context/EditModeContext';
import type { FactionId, SkillAllocation } from '@/data/types';
import {
  safeParseSkillAllocationPattern,
  validateSkillAllocationPattern,
} from '@/features/characters/utils/skillAllocation';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { editable } from '@/components/ui/editable';
import IconButton, { getIconButtonIconClassName } from '@/components/ui/IconButton';
import { TrashIcon } from '@/components/icons/CommonIcons';

import { usePublishedCharacter } from '../PublishedCharacterContext';
import SkillAllocationPathDisplay from './SkillAllocationPathDisplay';

const e = editable('characters');

type SkillAllocationDisplayProps = {
  allocation: SkillAllocation;
  factionId: FactionId;
  onRemove: (allocationId: string) => void;
  index: number;
};

const preprocessSkillAllocationPattern = (pattern: string): string => {
  if (pattern.length < 2) {
    return pattern;
  }

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

  return pattern;
};

const SkillAllocationDisplay: React.FC<SkillAllocationDisplayProps> = ({
  allocation,
  factionId,
  onRemove,
  index,
}) => {
  const { isEditMode } = useEditMode();
  const { characterId } = useLocalCharacter();
  const editRuntime = useActiveEditRuntime();
  const publishedCharacter = usePublishedCharacter(characterId);
  const character = useOptionalEditSnapshot(
    editRuntime?.stores.characters[characterId],
    publishedCharacter
  );
  const [isDarkMode] = useDarkMode();
  const { isDetailedView: isDetailed } = useAppContext();

  const processedPattern = useMemo(
    () => preprocessSkillAllocationPattern(allocation.pattern),
    [allocation.pattern]
  );

  const patternValidation = useMemo(
    () => validateSkillAllocationPattern(processedPattern),
    [processedPattern]
  );

  const parsedLevels = useMemo(() => {
    if (!patternValidation.isValid) {
      return [];
    }

    return safeParseSkillAllocationPattern(processedPattern) || [];
  }, [processedPattern, patternValidation.isValid]);

  const hasDescription = allocation.description?.trim();
  const hasAdditionalDescription = isDetailed && allocation.additionaldescription?.trim();
  const shouldShowDescriptionBlock = hasDescription || hasAdditionalDescription;

  return (
    <div className='space-y-3'>
      <div className='flex gap-4'>
        <div className='flex w-1/6 shrink-0 flex-col'>
          {isEditMode ? (
            <e.h4
              path={`skillAllocations.${index}.id`}
              initialValue={allocation.id}
              isSingleLine={true}
              className='text-lg leading-tight font-bold text-gray-800 dark:text-gray-200'
            />
          ) : (
            <h4 className='text-lg leading-tight font-bold text-gray-800 dark:text-gray-200'>
              {allocation.id}
            </h4>
          )}
          {isEditMode && (
            <e.p
              path={`skillAllocations.${index}.pattern`}
              initialValue={allocation.pattern}
              isSingleLine={true}
              className='text-sm text-gray-500 dark:text-gray-400'
              data-tutorial-id='skill-allocation-edit'
            />
          )}
        </div>
        <div className='flex-1'>
          {!patternValidation.isValid && (
            <div className='mb-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20'>
              <div className='flex items-start gap-2'>
                <div className='mt-0.5 h-5 w-5 shrink-0'>
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

          {patternValidation.isValid && parsedLevels.length > 0 ? (
            <SkillAllocationPathDisplay
              parsedLevels={parsedLevels}
              characterSkills={character.skills}
              characterName={character.id}
              factionId={factionId}
              isDarkMode={isDarkMode}
            />
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
            <IconButton
              type='button'
              aria-label='移除技能加点'
              onClick={() => onRemove(allocation.id)}
              variant='delete'
              size='md'
            >
              <TrashIcon className={getIconButtonIconClassName('md')} aria-hidden='true' />
            </IconButton>
          </div>
        )}
      </div>
      {shouldShowDescriptionBlock && (
        <div className='rounded-lg bg-gray-50 p-3 dark:bg-slate-800/50'>
          {isEditMode ? (
            <e.p
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
            <e.p
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
