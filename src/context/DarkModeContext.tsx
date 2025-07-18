'use client';
import { usePathname } from 'next/navigation';
import {
  useState,
  useCallback,
  createContext,
  ReactNode,
  useMemo,
  useContext,
  useLayoutEffect,
} from 'react';

// Cookie helper functions
const setCookie = (name: string, value: string) => {
  if (typeof document === 'undefined') return;

  // Get the root domain by removing subdomain
  const hostname = window.location.hostname;
  const rootDomain = hostname.split('.').slice(-2).join('.');

  // Set cookie with 1 year expiration (permanent) on root domain
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; path=/; domain=.${rootDomain}; SameSite=Lax; expires=${expires}; max-age=31536000`;
};

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
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
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const savedDarkMode = getCookie('darkMode');
    if (savedDarkMode !== null) {
      const isDark = savedDarkMode === 'true';
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [pathname]);

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
