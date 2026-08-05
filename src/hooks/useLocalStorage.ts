'use client';

import { useCallback, useEffect, useState } from 'react';

import { storage } from '@/lib/localStorage';

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
    const stored = storage.getJson<T>(key);
    if (stored !== undefined) {
      setValue(stored);
    }
  }, [key]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        if (e.newValue !== null) {
          const parsed = storage.parseJson<T>(e.newValue);
          if (parsed !== undefined) setValue(parsed);
        } else {
          setValue(defaultValue);
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
        storage.setJson(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  return [value, setStoredValue];
}
