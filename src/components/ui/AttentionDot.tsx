'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

import { cn } from '@/lib/design';

type AttentionDotProps = {
  /** Whether the dot should be visible at all */
  visible: boolean;
  /** Position classes — defaults to top-right corner */
  className?: string;
  /** Color theme: 'blue' | 'orange' — affects glow color */
  color?: 'blue' | 'orange';
};

/**
 * A small indicator dot (like an unread badge) with a gentle entrance glow.
 * Plays 3 soft pulse cycles on mount, then stays static.
 * Respects `prefers-reduced-motion` — skips pulse, shows static dot only.
 *
 * Reusable: place inside any `position: relative` container.
 * Pair with `useFeatureDiscovery` hook to manage dismissal logic.
 */
export default function AttentionDot({ visible, className, color = 'blue' }: AttentionDotProps) {
  const shouldReduceMotion = useReducedMotion();
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => {
    if (!visible || shouldReduceMotion) return;
    setPulsing(true);
    // 1.5s delay + 3 cycles × 2.5s each = 9s total
    const timer = setTimeout(() => setPulsing(false), 9000);
    return () => clearTimeout(timer);
  }, [visible, shouldReduceMotion]);

  if (!visible) return null;

  const colorClasses =
    color === 'orange' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-blue-500 dark:bg-blue-400';

  const glowClasses =
    color === 'orange'
      ? 'shadow-[0_0_6px_2px_rgba(249,115,22,0.6)] dark:shadow-[0_0_6px_2px_rgba(251,146,60,0.5)]'
      : 'shadow-[0_0_6px_2px_rgba(59,130,246,0.6)] dark:shadow-[0_0_6px_2px_rgba(96,165,250,0.5)]';

  return (
    <span
      className={cn(
        'pointer-events-none absolute z-20 size-2 rounded-full',
        colorClasses,
        pulsing && ['animate-attention-pulse', glowClasses],
        className
      )}
      aria-hidden='true'
    />
  );
}
