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

export const UserProvider =
  env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? ({ children }: { children: ReactNode; initialValue: UserType }) => {
        return children;
      }
    : ({ children, initialValue }: { children: ReactNode; initialValue: UserType }) => {
        return (
          <SWRConfig value={{ fallback: { [USER_API_KEY]: initialValue } }}>
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
