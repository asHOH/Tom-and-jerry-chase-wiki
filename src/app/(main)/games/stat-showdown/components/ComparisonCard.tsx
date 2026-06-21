'use client';

import { m, useReducedMotion } from 'motion/react';

import { cn } from '@/lib/design';
import GameImage from '@/components/ui/GameImage';

type ComparisonCardProps = {
  characterName: string;
  imageUrl: string;
  statValue: number | string | undefined;
  statLabel: string;
  isFlipped: boolean;
  isWinner: boolean | null; // null = not yet judged, true = higher, false = lower
  onSelect: () => void;
  disabled: boolean;
  /** When true, show "点击继续" hint (useful after a correct guess to skip to next round) */
  showAdvanceHint?: boolean;
};

/**
 * A character card that flips to reveal a stat value.
 * Uses motion/react 3D Y-axis rotation.
 */
export default function ComparisonCard({
  characterName,
  imageUrl,
  statValue,
  statLabel,
  isFlipped,
  isWinner,
  onSelect,
  disabled,
  showAdvanceHint = false,
}: ComparisonCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const displayValue = statValue != null ? String(statValue) : '?';

  const glowClass =
    isWinner === null
      ? ''
      : isWinner
        ? 'ring-4 ring-green-400 dark:ring-green-500 shadow-lg shadow-green-400/30'
        : 'ring-4 ring-red-400 dark:ring-red-500 shadow-lg shadow-red-400/30';

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'relative w-full max-w-[200px] touch-manipulation',
        'rounded-xl bg-white shadow-md dark:bg-gray-800',
        'transition-all duration-200',
        'focus:ring-2 focus:ring-blue-400 focus:outline-none',
        !disabled && !isFlipped && 'cursor-pointer hover:-translate-y-1 hover:shadow-lg',
        disabled && 'cursor-default',
        glowClass
      )}
      style={{ perspective: '800px' }}
      aria-label={`选择 ${characterName}`}
    >
      <m.div
        className='relative w-full'
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0.01 }
            : { type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }
        }
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front face — character portrait + name */}
        <div
          className='flex flex-col items-center gap-2 p-4'
          style={{ backfaceVisibility: 'hidden' }}
        >
          <GameImage src={imageUrl} alt={characterName} size='CHARACTER_CARD' />
          <p className='text-sm font-semibold text-gray-800 dark:text-gray-200'>{characterName}</p>
          {!isFlipped && !disabled && !showAdvanceHint && (
            <p className='text-xs text-gray-400 dark:text-gray-500'>点击选择</p>
          )}
          {showAdvanceHint && <p className='text-xs text-blue-500 dark:text-blue-400'>点击继续</p>}
        </div>

        {/* Back face — stat value */}
        <div
          className='absolute inset-0 flex flex-col items-center justify-center gap-1 p-4'
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span
            className={cn(
              'text-4xl font-bold',
              isWinner === true
                ? 'text-green-600 dark:text-green-400'
                : isWinner === false
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-800 dark:text-gray-200'
            )}
          >
            {displayValue}
          </span>
          <span className='text-xs text-gray-500 dark:text-gray-400'>{statLabel}</span>
        </div>
      </m.div>
    </button>
  );
}
