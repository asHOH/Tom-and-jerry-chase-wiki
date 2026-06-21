'use client';

import Link from 'next/link';

import { cn } from '@/lib/design';

import type { GameMode } from './ModeSelector';

const MODES: { id: GameMode; label: string }[] = [
  { id: 'all', label: '全部角色' },
  { id: 'cats', label: '猫阵营' },
  { id: 'mice', label: '鼠阵营' },
  { id: 'blitz', label: '限时挑战' },
];

const MODE_HREF: Record<GameMode, string> = {
  all: '/games/stat-showdown/all/',
  cats: '/games/stat-showdown/cats/',
  mice: '/games/stat-showdown/mice/',
  blitz: '/games/stat-showdown/blitz/',
};

type ModeNavProps = {
  currentMode: GameMode;
};

/**
 * Navigation tabs for switching between Stat Showdown mode pages.
 */
export default function ModeNav({ currentMode }: ModeNavProps) {
  return (
    <nav className='flex justify-center'>
      <div className='inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-600 dark:bg-gray-800'>
        {MODES.map((m) => (
          <Link
            key={m.id}
            href={MODE_HREF[m.id]}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              currentMode === m.id
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {m.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
