import { useDarkMode } from '@/context/DarkModeContext';
import { motion } from 'motion/react';
import clsx from 'clsx';

export function DarkModeToggleButton() {
  const [isDarkMode, toggleDarkMode] = useDarkMode(); // dark: class can also be used directly
  return (
    <motion.button
      type='button'
      onClick={toggleDarkMode}
      className={clsx(
        'flex h-10 w-10 items-center justify-center rounded-md border-none bg-gray-200 p-2 text-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300 md:h-[42px] md:w-[42px] md:p-2 lg:h-11 lg:w-11 lg:p-2.5',
        'dark:bg-slate-700 dark:text-gray-200',
        'cursor-pointer'
      )}
      whileTap={{ scale: 0.85, rotate: 15 }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {isDarkMode ? (
        // Moon icon
        <svg
          className='h-6 w-6 text-gray-900 dark:text-gray-200'
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
      ) : (
        // Sun icon
        <svg
          className='h-6 w-6 text-yellow-500'
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
      )}
    </motion.button>
  );
}
