'use client';
import { useState, useCallback, createContext, ReactNode, useMemo, useContext } from 'react';

// Cookie helper functions
const setCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;

  // Get the root domain by removing subdomain
  const hostname = window.location.hostname;
  const rootDomain = hostname.split('.').slice(-2).join('.');

  // Set cookie without expiration (permanent) on root domain
  document.cookie = `${name}=${value}; path=/; domain=.${rootDomain}; SameSite=Lax`;
};

const DarkModeContext = createContext<readonly [boolean, () => void]>([false, () => {}]);

export function DarkModeProvider({
  initialValue = false,
  children,
}: {
  initialValue?: boolean;
  children: ReactNode;
}) {
  const [isDarkMode, setIsDarkMode] = useState(initialValue);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      setCookie('darkMode', String(next));
      return next;
    });
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
