'use client';

import Image from 'next/image';

import { cn } from '@/lib/design';
import Button from '@/components/ui/Button';
import { ClockIcon, TargetIcon } from '@/components/icons/CommonIcons';

export type GameMode = 'cats' | 'mice' | 'all' | 'blitz';

type ModeSelectorProps = {
  currentMode: GameMode;
  onSelect: (mode: GameMode) => void;
};

type ModeDef = {
  id: GameMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
};

const MODES: ModeDef[] = [
  {
    id: 'cats',
    label: '猫阵营',
    desc: '21 只猫',
    icon: (
      <Image
        src='/images/icons/cat-faction.png'
        alt=''
        width={28}
        height={28}
        className='object-contain'
      />
    ),
  },
  {
    id: 'mice',
    label: '鼠阵营',
    desc: '39 只鼠',
    icon: (
      <Image
        src='/images/icons/mouse-faction.png'
        alt=''
        width={28}
        height={28}
        className='object-contain'
      />
    ),
  },
  {
    id: 'all',
    label: '全部角色',
    desc: '60 名角色',
    icon: <TargetIcon className='h-7 w-7' />,
  },
  {
    id: 'blitz',
    label: '限时挑战',
    desc: '30 秒冲刺',
    icon: <ClockIcon className='h-7 w-7' />,
  },
];

/**
 * Mode selection buttons for the Stat Showdown game.
 */
export default function ModeSelector({ currentMode, onSelect }: ModeSelectorProps) {
  return (
    <div className='flex flex-wrap justify-center gap-2'>
      {MODES.map((m) => (
        <Button
          variant='unstyled'
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-2.5 transition-all',
            'min-w-20 touch-manipulation',
            currentMode === m.id
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
              : 'border-border bg-surface hover:border-gray-300 dark:hover:border-slate-600'
          )}
        >
          <span className='flex h-7 items-center justify-center'>{m.icon}</span>
          <span className='text-xs font-medium text-gray-700 dark:text-gray-300'>{m.label}</span>
          <span className='text-[10px] text-gray-400 dark:text-gray-500'>{m.desc}</span>
        </Button>
      ))}
    </div>
  );
}
