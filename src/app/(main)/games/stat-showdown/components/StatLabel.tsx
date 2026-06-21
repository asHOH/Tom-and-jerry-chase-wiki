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

/**
 * Displays the name of the stat being compared.
 */
export default function StatLabel({ statName }: StatLabelProps) {
  return (
    <div className='text-center'>
      <span className='inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'>
        📊 比较: {STAT_LABELS[statName] ?? statName}
      </span>
    </div>
  );
}
