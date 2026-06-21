'use client';

type StatLabelProps = {
  statName: string;
};

const STAT_LABELS: Record<string, string> = {
  maxHp: '最大血量',
  attackBoost: '攻击增伤 (%)',
  moveSpeed: '移动速度',
  jumpHeight: '跳跃高度',
  clawKnifeCdHit: '爪刀CD (命中)',
  cheesePushSpeed: '推奶酪速度',
  wallCrackDamageBoost: '砸墙破坏力',
};

/** Stats where a lower value is better */
const LOWER_IS_BETTER = new Set(['clawKnifeCdHit']);

/**
 * Displays the name of the stat being compared and the comparison direction.
 */
export default function StatLabel({ statName }: StatLabelProps) {
  const direction = LOWER_IS_BETTER.has(statName) ? '选择数值更低的角色' : '选择数值更高的角色';

  return (
    <div className='space-y-1 text-center'>
      <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'>
        <svg
          className='h-4 w-4'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          strokeWidth={2}
        >
          <path strokeLinecap='round' strokeLinejoin='round' d='M3 3v18h18M7 16l4-8 4 4 4-6' />
        </svg>
        比较: {STAT_LABELS[statName] ?? statName}
      </span>
      <p className='text-xs text-gray-400 dark:text-gray-500'>{direction}</p>
    </div>
  );
}
