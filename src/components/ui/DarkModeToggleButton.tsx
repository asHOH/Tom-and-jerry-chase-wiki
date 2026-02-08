import { m } from 'motion/react';

import { getNavigationButtonClasses } from '@/lib/design-system';
import { useDarkMode } from '@/context/DarkModeContext';

export function DarkModeToggleButton() {
  const [, toggleDarkMode] = useDarkMode(); // Avoid SSR/client mismatch by not branching on theme
  return (
    <m.button
      type='button'
      onClick={toggleDarkMode}
      className={getNavigationButtonClasses(false, false, true)}
      whileTap={{ scale: 0.95, rotate: 15 }}
      whileHover={{ scale: 1.05 }}
      aria-label='切换深色模式'
    >
      <svg
        className='h-6 w-6 text-yellow-500 dark:hidden'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <circle cx='12' cy='12' r='5' stroke='currentColor' strokeWidth='2' />
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'
        />
      </svg>

      <svg
        className='hidden h-6 w-6 text-gray-900 dark:block dark:text-gray-200'
        fill='none'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth='2'
          d='M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z'
        />
      </svg>
    </m.button>
  );
}
