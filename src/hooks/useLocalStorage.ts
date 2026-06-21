'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * SSR-safe localStorage hook with cross-tab synchronization.
 *
 * @param key - localStorage key
 * @param defaultValue - Fallback value when key is not found or during SSR
 * @returns [value, setValue] — setValue accepts both direct values and functional updaters
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  // Initialize from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      // localStorage unavailable or corrupted — keep default
    }
  }, [key]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          if (e.newValue !== null) {
            setValue(JSON.parse(e.newValue) as T);
          } else {
            setValue(defaultValue);
          }
        } catch {
          // Ignore parse errors from other tabs
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, defaultValue]);

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = newValue instanceof Function ? newValue(prev) : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // Storage full or unavailable — silently ignore
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue];
}
