'use client';

import { generateGuessShareText } from '@/lib/gameUtils';
import { BaseDialog } from '@/components/ui/BaseDialog';
import GameImage from '@/components/ui/GameImage';

type ResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  puzzleNumber: number;
  characterName: string;
  characterImageUrl: string;
  characterFaction: string;
  guesses: string[];
  correctGuessIndex: number | null;
  maxClues: number;
  onPlayAgain: () => void;
  isDaily: boolean;
};

/**
 * Result modal shown when the game ends (win or lose).
 * Displays the character reveal and a shareable result grid.
 */
export default function ResultDialog({
  open,
  onOpenChange,
  puzzleNumber,
  characterName,
  characterImageUrl,
  characterFaction,
  guesses,
  correctGuessIndex,
  maxClues,
  onPlayAgain,
  isDaily,
}: ResultDialogProps) {
  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel='游戏结果'
      panelClassName='max-w-md w-[90vw] p-6'
    >
      <div className='flex flex-col items-center gap-4 text-center'>
        {/* Result header */}
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          {correctGuessIndex !== null ? '猜对了！' : '再接再厉'}
        </h2>

        {/* Character reveal */}
        <div className='flex flex-col items-center gap-2'>
          <GameImage src={characterImageUrl} alt={characterName} size='CHARACTER_CARD' />
          <p className='text-xl font-semibold text-gray-800 dark:text-gray-200'>{characterName}</p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>{characterFaction}</p>
        </div>

        {/* Result grid */}
        <pre className='rounded-lg bg-gray-50 p-4 text-center font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 dark:bg-gray-800 dark:text-gray-200'>
          {generateGuessShareText(puzzleNumber, guesses, correctGuessIndex, characterName, maxClues)
            .split('\n')
            .filter((l) => !l.startsWith('来试试'))
            .join('\n')}
        </pre>

        {/* Action buttons */}
        <button
          onClick={onPlayAgain}
          className='rounded-lg bg-blue-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-600'
        >
          {isDaily ? '无限练习模式' : '再来一局'}
        </button>
      </div>
    </BaseDialog>
  );
}
