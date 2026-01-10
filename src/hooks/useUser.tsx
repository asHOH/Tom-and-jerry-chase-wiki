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

const localStorageProvider = () => {
  // When initializing, we restore the data from `localStorage` into a map.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialEntries: Array<[string, any]> = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('swr-cache');
      if (stored) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialEntries = JSON.parse(stored) as Array<[string, any]>;
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
        const appCache = JSON.stringify(Array.from(map.entries()));
        localStorage.setItem('swr-cache', appCache);
      } catch (error) {
        console.warn('Failed to save SWR cache to localStorage', error);
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
