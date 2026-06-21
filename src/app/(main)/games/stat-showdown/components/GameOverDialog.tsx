'use client';

import ShareButton from '@/features/games/components/ShareButton';
import { BaseDialog } from '@/components/ui/BaseDialog';

type GameOverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  highScore: number;
  onPlayAgain: () => void;
};

/**
 * Game over modal for the Stat Showdown game.
 */
export default function GameOverDialog({
  open,
  onOpenChange,
  score,
  highScore,
  onPlayAgain,
}: GameOverDialogProps) {
  const isNewHigh = score > 0 && score >= highScore;

  const getShareText = () =>
    [
      `能力对决`,
      `最终得分: ${score} 连胜`,
      isNewHigh ? '新纪录！' : `最高纪录: ${highScore}`,
      '',
      '来试试：tjwiki.com/games/stat-showdown/',
    ].join('\n');

  return (
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      ariaLabel='游戏结束'
      panelClassName='max-w-sm w-[90vw] p-6'
    >
      <div className='flex flex-col items-center gap-4 text-center'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>游戏结束</h2>

        <div className='space-y-1'>
          <p className='text-4xl font-bold text-blue-600 dark:text-blue-400'>{score}</p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>连胜次数</p>
        </div>

        {isNewHigh && (
          <p className='inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'>
            <svg
              className='h-4 w-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
              />
            </svg>
            新纪录！
          </p>
        )}

        <p className='text-sm text-gray-500 dark:text-gray-400'>最高纪录: {highScore}</p>

        <ShareButton getShareText={getShareText} label='分享成绩' />

        <button
          onClick={onPlayAgain}
          className='rounded-lg bg-blue-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-blue-600'
        >
          再来一局
        </button>
      </div>
    </BaseDialog>
  );
}
