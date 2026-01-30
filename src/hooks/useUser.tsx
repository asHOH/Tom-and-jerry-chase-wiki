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

const localStorageProvider = () => {
  // When initializing, we restore the data from `localStorage` into a map.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialEntries: Array<[string, any]> = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        // Check size before parsing to avoid performance hit on corrupted/large data
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

  // Before unloading the app, we write back all the data into `localStorage`.
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      try {
        const entries = Array.from(map.entries());
        const appCache = JSON.stringify(entries);

        // Enforce size limit: if too large, keep only recent entries
        if (appCache.length > MAX_CACHE_SIZE && entries.length > 1) {
          // Sort by recency (last item is most recent) and trim
          const trimmed = entries.slice(-Math.max(1, Math.floor(entries.length / 2)));
          const trimmedCache = JSON.stringify(trimmed);
          localStorage.setItem(CACHE_KEY, trimmedCache);
        } else {
          localStorage.setItem(CACHE_KEY, appCache);
        }
      } catch (error) {
        console.warn('Failed to save SWR cache to localStorage', error);
        // Clear cache on quota exceeded
        try {
          localStorage.removeItem(CACHE_KEY);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  }

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
