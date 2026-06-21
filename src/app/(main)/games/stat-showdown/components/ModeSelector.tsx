'use client';

import Image from 'next/image';

import { cn } from '@/lib/design';

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
    icon: (
      <svg
        className='h-7 w-7'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'
        />
        <path strokeLinecap='round' strokeLinejoin='round' d='M12 18a6 6 0 100-12 6 6 0 000 12z' />
        <path strokeLinecap='round' strokeLinejoin='round' d='M12 14a2 2 0 100-4 2 2 0 000 4z' />
      </svg>
    ),
  },
  {
    id: 'blitz',
    label: '限时挑战',
    desc: '30 秒冲刺',
    icon: (
      <svg
        className='h-7 w-7'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
        strokeWidth={1.5}
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
        />
      </svg>
    ),
  },
];

/**
 * Mode selection buttons for the Stat Showdown game.
 */
export default function ModeSelector({ currentMode, onSelect }: ModeSelectorProps) {
  return (
    <div className='flex flex-wrap justify-center gap-2'>
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onSelect(m.id)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-2.5 transition-all',
            'min-w-[80px] touch-manipulation',
            currentMode === m.id
              ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
              : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
          )}
        >
          <span className='flex h-7 items-center justify-center'>{m.icon}</span>
          <span className='text-xs font-medium text-gray-700 dark:text-gray-300'>{m.label}</span>
          <span className='text-[10px] text-gray-400 dark:text-gray-500'>{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
