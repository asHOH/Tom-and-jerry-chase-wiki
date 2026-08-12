import { getNavigationButtonClasses } from '@/lib/design';
import { useDarkMode } from '@/context/DarkModeContext';
import MotionButton from '@/components/ui/MotionButton';
import { MoonIcon, SunIcon } from '@/components/icons/CommonIcons';

export function DarkModeToggleButton() {
  const [, toggleDarkMode] = useDarkMode(); // Avoid SSR/client mismatch by not branching on theme
  return (
    <MotionButton
      variant='unstyled'
      type='button'
      onClick={toggleDarkMode}
      className={getNavigationButtonClasses(false, false, true)}
      whileTap={{ scale: 0.95, rotate: 15 }}
      whileHover={{ scale: 1.05 }}
      aria-label='切换深色模式'
    >
      <SunIcon className='h-6 w-6 text-yellow-500 dark:hidden' />
      <MoonIcon className='hidden h-6 w-6 text-gray-900 dark:block dark:text-gray-200' />
    </MotionButton>
  );
}
