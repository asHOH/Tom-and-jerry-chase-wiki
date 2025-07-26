'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-5 h-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          )}
          <span className='text-sm'>
            {characterName || (direction === 'left' ? '上一个角色' : '下一个角色')}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
