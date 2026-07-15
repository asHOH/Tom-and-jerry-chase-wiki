'use client';

import { ReactNode, useEffect } from 'react';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

import type { PermissionGrant } from '@/lib/auth/permissions';
import { supabase } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';

export type UserType = {
  nickname: string | null;
  grants: PermissionGrant[];
  groups: Array<{ id: string; name: string }>;
};

const EMPTY_USER: UserType = { nickname: null, grants: [], groups: [] };

export const USER_API_KEY = '/api/auth/me';

async function getUserData() {
  if (!hasSupabasePublicConfig()) {
    return EMPTY_USER;
  }

  const res = await fetch(USER_API_KEY, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    return EMPTY_USER;
  }

  const data = (await res.json().catch(() => null)) as {
    nickname?: string | null;
    grants?: PermissionGrant[];
    groups?: Array<{ id: string; name: string }>;
  } | null;

  return {
    nickname: data?.nickname ?? null,
    grants: data?.grants ?? [],
    groups: data?.groups ?? [],
  };
}

const AuthListener = () => {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      mutate(USER_API_KEY);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [mutate]);

  return null;
};

const MAX_CACHE_SIZE = 1024 * 1024; // 1MB limit to prevent performance issues
const CACHE_KEY = 'swr-cache';
const SAVE_DEBOUNCE_MS = 1500;

const localStorageProvider = () => {
  // When initializing, we restore the data from `localStorage` into a map.
  // oxlint-disable-next-line typescript/no-explicit-any
  let initialEntries: Array<[string, any]> = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        // Guard against oversized/corrupted cache to avoid parse overhead
        if (stored.length > MAX_CACHE_SIZE) {
          console.warn('SWR cache exceeds size limit, clearing');
          localStorage.removeItem(CACHE_KEY);
        } else {
          // oxlint-disable-next-line typescript/no-explicit-any
          const parsed = JSON.parse(stored) as Array<[string, any]>;
          if (Array.isArray(parsed)) {
            // Filter out user data to avoid hydration mismatch with server-rendered HTML
            initialEntries = parsed.filter(([key]) => key !== USER_API_KEY);
          } else {
            localStorage.removeItem(CACHE_KEY);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore SWR cache from localStorage', error);
    }
  }

  // oxlint-disable-next-line typescript/no-explicit-any
  const map = new Map<string, any>(initialEntries);
  let saveTimer: number | undefined;

  const trimToSize = (entries: Array<[string, unknown]>) => {
    if (entries.length <= 1) return entries;
    let trimmed = entries;
    while (trimmed.length > 1) {
      const serialized = JSON.stringify(trimmed);
      if (serialized.length <= MAX_CACHE_SIZE) break;
      trimmed = trimmed.slice(1); // drop oldest
    }
    return trimmed;
  };

  const persistCache = () => {
    const entries = Array.from(map.entries());
    let payload = entries;
    let serialized = JSON.stringify(payload);

    if (serialized.length > MAX_CACHE_SIZE) {
      if (payload.length > 1) {
        payload = trimToSize(entries);
        serialized = JSON.stringify(payload);
      } else {
        // Single entry is too large; skip persisting to avoid quota issues
        return;
      }
    }

    localStorage.setItem(CACHE_KEY, serialized);
  };

  const flushNow = () => {
    try {
      persistCache();
    } catch (error) {
      console.warn('Failed to save SWR cache to localStorage', error);
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {
        // ignore
      }
    }
  };

  const scheduleSave = () => {
    if (typeof window === 'undefined') return;
    if (saveTimer !== undefined) {
      window.clearTimeout(saveTimer);
    }
    saveTimer = window.setTimeout(() => {
      flushNow();
    }, SAVE_DEBOUNCE_MS);
  };

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        flushNow();
      }
    });
    window.addEventListener('pagehide', () => {
      flushNow();
    });
  }

  // Patch mutating methods to trigger incremental persistence
  const originalSet = map.set.bind(map);
  // oxlint-disable-next-line typescript/no-explicit-any
  map.set = (key: string, value: any) => {
    const result = originalSet(key, value);
    scheduleSave();
    return result;
  };

  const originalDelete = map.delete.bind(map);
  map.delete = (key: string) => {
    const result = originalDelete(key);
    if (result) scheduleSave();
    return result;
  };

  const originalClear = map.clear.bind(map);
  map.clear = () => {
    originalClear();
    scheduleSave();
  };

  // We still use the map for write & read for performance.
  return map;
};

export const UserProvider = !hasSupabasePublicConfig()
  ? ({ children }: { children: ReactNode; initialValue: UserType }) => {
      return children;
    }
  : ({ children, initialValue }: { children: ReactNode; initialValue: UserType }) => {
      return (
        <SWRConfig
          value={{
            fallback: { [USER_API_KEY]: initialValue },
            provider: localStorageProvider,
            dedupingInterval: 10000,
          }}
        >
          <AuthListener />
          {children}
        </SWRConfig>
      );
    };

export const useUser = () => {
  const { data, mutate, isLoading, isValidating } = useSWR<UserType>(USER_API_KEY, getUserData);

  const clearData = () => {
    mutate(EMPTY_USER, false);
  };

  return {
    nickname: data?.nickname ?? null,
    grants: data?.grants ?? [],
    groups: data?.groups ?? [],
    isLoading,
    isValidating,
    mutate,
    clearData,
  };
};
