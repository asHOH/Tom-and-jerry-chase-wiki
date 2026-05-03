'use client';

import { startTransition, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
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
  const [hasMounted, setHasMounted] = useState(false);
  const resolvedIsDarkMode = resolvedTheme === 'dark';
  const isDarkMode = hasMounted && resolvedIsDarkMode;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const toggleDarkMode = useCallback(() => {
    startTransition(() => {
      setTheme(resolvedIsDarkMode ? 'light' : 'dark');
    });
  }, [resolvedIsDarkMode, setTheme]);

  return useMemo(() => [isDarkMode, toggleDarkMode] as const, [isDarkMode, toggleDarkMode]);
}
