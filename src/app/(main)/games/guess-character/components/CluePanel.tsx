'use client';

import { cn } from '@/lib/design';
import TextWithHoverTooltips from '@/features/shared/components/TextWithHoverTooltips';
import { LockClosedIcon } from '@/components/icons/CommonIcons';

/** A single clue entry */
export type ClueEntry = {
  label: string;
  value: string;
  /** Whether this is a skill-effect clue (gets special formatting) */
  isSkillEffect?: boolean;
};

type CluePanelProps = {
  clues: ClueEntry[];
  revealedCount: number;
  maxClues: number;
};

/**
 * Displays progressively revealed clues for the Guess Character game.
 * Clues beyond `revealedCount` are shown as locked/question marks.
 */
export default function CluePanel({ clues, revealedCount, maxClues }: CluePanelProps) {
  return (
    <div className='space-y-3'>
      <h3 className='text-center text-sm font-medium text-gray-500 dark:text-gray-400'>
        线索 ({revealedCount}/{maxClues})
      </h3>

      <div className='space-y-2'>
        {clues.map((clue, index) => {
          const isRevealed = index < revealedCount;

          return (
            <div
              key={index}
              className={cn(
                'rounded-lg border p-3 transition-all duration-300',
                isRevealed
                  ? 'border-blue-200 bg-blue-50/50 dark:border-blue-700 dark:bg-blue-900/20'
                  : 'border-border bg-surface-sunken'
              )}
            >
              {isRevealed ? (
                <div className={clue.isSkillEffect ? 'space-y-1.5' : ''}>
                  <span className='text-xs font-medium text-gray-400 dark:text-gray-500'>
                    {clue.label}
                  </span>
                  {clue.isSkillEffect ? (
                    <div className='mt-1 text-sm leading-relaxed whitespace-pre-line text-gray-800 dark:text-gray-200'>
                      <TextWithHoverTooltips text={clue.value} />
                    </div>
                  ) : (
                    <p className='text-gray-800 dark:text-gray-200'>{clue.value}</p>
                  )}
                </div>
              ) : (
                <div className='flex items-center gap-2 text-gray-400 dark:text-gray-500'>
                  <LockClosedIcon className='h-4 w-4' />
                  <span className='text-sm'>线索 #{index + 1} — 尚未解锁</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
