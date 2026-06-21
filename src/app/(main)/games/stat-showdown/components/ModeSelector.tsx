'use client';

import { cn } from '@/lib/design';

export type GameMode = 'cats' | 'mice' | 'all' | 'blitz';

type ModeSelectorProps = {
  currentMode: GameMode;
  onSelect: (mode: GameMode) => void;
};

const MODES: { id: GameMode; label: string; icon: string; desc: string }[] = [
  { id: 'cats', label: '猫阵营', icon: '🐱', desc: '21 只猫' },
  { id: 'mice', label: '鼠阵营', icon: '🐭', desc: '39 只鼠' },
  { id: 'all', label: '全部角色', icon: '🎯', desc: '60 名角色' },
  { id: 'blitz', label: '限时挑战', icon: '⏱️', desc: '30 秒冲刺' },
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
          <span className='text-xl'>{m.icon}</span>
          <span className='text-xs font-medium text-gray-700 dark:text-gray-300'>{m.label}</span>
          <span className='text-[10px] text-gray-400 dark:text-gray-500'>{m.desc}</span>
        </button>
      ))}
    </div>
  );
}
