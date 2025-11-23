'use client';

import { AnimatePresence, motion } from 'motion/react';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/CommonIcons';

interface SwipeNavigationIndicatorProps {
  direction: 'left' | 'right' | null;
  characterName?: string | undefined;
}

export default function SwipeNavigationIndicator({
  direction,
  characterName,
}: SwipeNavigationIndicatorProps) {
  if (!direction) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`fixed top-1/2 z-50 -translate-y-1/2 transform ${
          direction === 'left' ? 'left-4' : 'right-4'
        }`}
        initial={{ opacity: 0, scale: 0.8, x: direction === 'left' ? -20 : 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: direction === 'left' ? -20 : 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className='flex items-center gap-2 rounded-lg bg-black/80 px-4 py-2 text-white shadow-lg'>
          {direction === 'left' ? (
            <ChevronLeftIcon className='h-5 w-5' />
          ) : (
            <ChevronRightIcon className='h-5 w-5' />
          )}
          <span className='text-sm'>
            {characterName || (direction === 'left' ? '上一个角色' : '下一个角色')}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
