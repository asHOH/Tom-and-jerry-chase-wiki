'use client';
import {
  useState,
  useEffect,
  useCallback,
  createContext,
  ReactNode,
  useMemo,
  useContext,
} from 'react';

const DarkModeContext = createContext<readonly [boolean, () => void]>([false, () => {}]);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('darkMode');
    const bodyHasDark = document.documentElement.classList.contains('dark');
    if (stored !== null) {
      const dark = stored === 'true';
      setIsDarkMode(dark);
      if (dark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(bodyHasDark);
    }
  }, []);

  const contextValue = useMemo(
    () => [isDarkMode, toggleDarkMode] as const,
    [isDarkMode, toggleDarkMode]
  );
  if (typeof window !== 'undefined') {
    // @ts-expect-error: debugging purpose
    window.toggleDarkMode = toggleDarkMode;
  }

  return <DarkModeContext value={contextValue}>{children}</DarkModeContext>;
}

export function useDarkMode(): readonly [boolean, () => void] {
  return useContext(DarkModeContext);
}
