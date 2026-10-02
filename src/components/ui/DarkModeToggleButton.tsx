'use client';

import { useReducedMotion } from 'motion/react';

import { getNavigationButtonClasses } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import MotionButton from '@/components/ui/MotionButton';
import { MoonIcon, SunIcon } from '@/components/icons/CommonIcons';

export function DarkModeToggleButton() {
  const [, toggleDarkMode] = useDarkMode();
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionButton
      variant='unstyled'
      type='button'
      onClick={toggleDarkMode}
      className={getNavigationButtonClasses(false, false, true)}
      whileTap={shouldReduceMotion ? {} : { scale: 0.95, rotate: 15 }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
      aria-label='切换深色模式'
    >
      <SunIcon aria-hidden='true' className='size-6 text-yellow-500 dark:hidden' />
      <MoonIcon
        aria-hidden='true'
        className='hidden size-6 text-gray-900 dark:block dark:text-gray-200'
      />
    </MotionButton>
  );
}
