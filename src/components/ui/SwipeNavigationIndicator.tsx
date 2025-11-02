'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/CommonIcons';
import { AnimatePresence, motion } from 'motion/react';

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
        className={`fixed top-1/2 transform -translate-y-1/2 z-50 ${
          direction === 'left' ? 'left-4' : 'right-4'
        }`}
        initial={{ opacity: 0, scale: 0.8, x: direction === 'left' ? -20 : 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: direction === 'left' ? -20 : 20 }}
        transition={{ duration: 0.2 }}
      >
        <div className='bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2'>
          {direction === 'left' ? (
            <ChevronLeftIcon className='w-5 h-5' />
          ) : (
            <ChevronRightIcon className='w-5 h-5' />
          )}
          <span className='text-sm'>
            {characterName || (direction === 'left' ? '上一个角色' : '下一个角色')}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
