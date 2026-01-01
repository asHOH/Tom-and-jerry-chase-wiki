'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { supabase } from '@/lib/supabase/client';

type UserType = { role: string | null; nickname: string | null };

const userObject = proxy<UserType & { clearData: () => void }>({
  role: null,
  nickname: null,
  clearData() {
    userObject.role = null;
    userObject.nickname = null;
  },
});

const applyUserData = (data: UserType, { allowEmpty = false }: { allowEmpty?: boolean } = {}) => {
  if (!allowEmpty && !data.nickname && !data.role) {
    return;
  }
  Object.assign(userObject, data);
};

export const UserProvider =
  process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? ({ children }: { children: ReactNode; initialValue: UserType }) => {
        return children;
      }
    : ({ children, initialValue }: { children: ReactNode; initialValue: UserType }) => {
        const hasAppliedInitial = useRef(false);
        if (!hasAppliedInitial.current) {
          applyUserData(initialValue, { allowEmpty: true });
          hasAppliedInitial.current = true;
        }

        useEffect(() => {
          applyUserData(initialValue, { allowEmpty: true });
        }, [initialValue]);

        useEffect(() => {
          (async () => {
            const clientUser = await getUserData();
            const shouldAllowEmpty = !userObject.nickname && !userObject.role;
            applyUserData(clientUser, { allowEmpty: shouldAllowEmpty });
          })();
        }, []);
        useEffect(() => {
          const {
            data: { subscription },
          } = supabase.auth.onAuthStateChange(async (event) => {
            const clientUser = await getUserData();
            const shouldAllowEmpty = event === 'SIGNED_OUT';
            applyUserData(clientUser, { allowEmpty: shouldAllowEmpty });
          });
          return () => {
            subscription.unsubscribe();
          };
        }, []);
        return children;
      };

async function getUserData() {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      role: null,
      nickname: null,
    };
  }

  const res = await fetch('/api/auth/me', {
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

export const useUser = () => {
  return useSnapshot(userObject);
};
