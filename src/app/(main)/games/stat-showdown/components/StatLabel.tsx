'use client';

import {
  CHARACTER_GAME_STAT_INFO,
  type CharacterGameStatKey,
} from '@/features/games/characterStatCatalog';
import { ChartLineIcon } from '@/components/icons/CommonIcons';

type StatLabelProps = {
  statName: CharacterGameStatKey;
};

/**
 * Displays the name of the stat being compared and the comparison direction.
 */
export default function StatLabel({ statName }: StatLabelProps) {
  const stat = CHARACTER_GAME_STAT_INFO[statName];
  const direction = stat.higherIsBetter ? '选择数值更高的角色' : '选择数值更低的角色';

  return (
    <div className='space-y-1 text-center'>
      <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'>
        <ChartLineIcon className='h-4 w-4' />
        比较: {stat.label}
      </span>
      <p className='text-xs text-gray-400 dark:text-gray-500'>{direction}</p>
    </div>
  );
}
