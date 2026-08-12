'use client';

import ShareButton from '@/features/games/components/ShareButton';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import { SparklesIcon } from '@/components/icons/CommonIcons';

import type { GameMode } from './ModeSelector';

type GameOverDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: GameMode;
  score: number;
  highScore: number;
  onPlayAgain: () => void;
};

const MODE_LABELS: Record<GameMode, string> = {
  cats: '猫阵营',
  mice: '鼠阵营',
  all: '全部角色',
  blitz: '限时挑战',
};

/**
 * Game over modal for the Stat Showdown game.
 */
export default function GameOverDialog({
  open,
  onOpenChange,
  mode,
  score,
  highScore,
  onPlayAgain,
}: GameOverDialogProps) {
  const isNewHigh = score > 0 && score >= highScore;

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
          <p className='text-sm text-gray-500 dark:text-gray-400'>得分</p>
        </div>

        {isNewHigh && (
          <p className='inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'>
            <SparklesIcon className='h-4 w-4' />
            新纪录！
          </p>
        )}

        <p className='text-sm text-gray-500 dark:text-gray-400'>最高纪录: {highScore}</p>

        <div className='flex flex-wrap justify-center gap-3'>
          <ShareButton
            getShareText={() =>
              [
                '能力对决',
                '',
                `我在${MODE_LABELS[mode]}模式获得了 ${score} 分！`,
                '',
                '来挑战：www.tjwiki.com/games/stat-showdown/',
              ].join('\n')
            }
          />
          <Button onClick={onPlayAgain}>再来一局</Button>
        </div>
      </div>
    </BaseDialog>
  );
}
