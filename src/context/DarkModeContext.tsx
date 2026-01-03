'use client';

import { startTransition, useCallback, useMemo, type ReactNode } from 'react';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';

export function DarkModeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider attribute='class' defaultTheme='system' enableSystem storageKey='darkMode'>
      {children}
    </NextThemeProvider>
  );
}

export function useDarkMode(): readonly [boolean, () => void] {
  const { resolvedTheme, setTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  const toggleDarkMode = useCallback(() => {
    startTransition(() => {
      setTheme(isDarkMode ? 'light' : 'dark');
    });
  }, [isDarkMode, setTheme]);

  return useMemo(() => [isDarkMode, toggleDarkMode] as const, [isDarkMode, toggleDarkMode]);
}
