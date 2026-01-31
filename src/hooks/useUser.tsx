'use client';

import { ReactNode, useEffect } from 'react';
import useSWR, { SWRConfig, useSWRConfig } from 'swr';

import { supabase } from '@/lib/supabase/client';
import { env } from '@/env';

type UserType = { role: string | null; nickname: string | null };

export const USER_API_KEY = '/api/auth/me';

async function getUserData() {
  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      role: null,
      nickname: null,
    };
  }

  const res = await fetch(USER_API_KEY, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    return { role: null, nickname: null };
  }

  const data = (await res.json().catch(() => null)) as {
    role?: string | null;
    nickname?: string | null;
  } | null;

  return {
    role: data?.role ?? null,
    nickname: data?.nickname ?? null,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialEntries = JSON.parse(stored) as Array<[string, any]>;
        }
      }
    } catch (error) {
      console.warn('Failed to restore SWR cache from localStorage', error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    if (serialized.length > MAX_CACHE_SIZE && payload.length > 1) {
      payload = trimToSize(entries);
      serialized = JSON.stringify(payload);
    }

    localStorage.setItem(CACHE_KEY, serialized);
  };

  const scheduleSave = () => {
    if (typeof window === 'undefined') return;
    if (saveTimer !== undefined) {
      window.clearTimeout(saveTimer);
    }
    saveTimer = window.setTimeout(() => {
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
    }, SAVE_DEBOUNCE_MS);
  };

  // Patch mutating methods to trigger incremental persistence
  const originalSet = map.set.bind(map);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const UserProvider =
  env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? ({ children }: { children: ReactNode; initialValue: UserType }) => {
        return children;
      }
    : ({ children, initialValue }: { children: ReactNode; initialValue: UserType }) => {
        return (
          <SWRConfig
            value={{
              fallback: { [USER_API_KEY]: initialValue },
              provider: localStorageProvider,
            }}
          >
            <AuthListener />
            {children}
          </SWRConfig>
        );
      };

export const useUser = () => {
  const { data, mutate } = useSWR<UserType>(USER_API_KEY, getUserData);

  const clearData = () => {
    mutate({ role: null, nickname: null }, false);
  };

  return {
    role: data?.role ?? null,
    nickname: data?.nickname ?? null,
    mutate,
    clearData,
  };
};
