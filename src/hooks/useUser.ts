'use client';

import { useEffect, ReactNode, use } from 'react';
import { proxy, useSnapshot } from 'valtio';
import { supabase } from '@/lib/supabase/client';

type UserType = { role: string | null; nickname: string | null };

export const userObject = proxy<UserType & { clearData: () => void }>({
  role: null,
  nickname: null,
  clearData() {
    userObject.role = null;
    userObject.nickname = null;
  },
});

export const UserProvider = ({
  children,
  initialValue,
}: {
  children: ReactNode;
  initialValue: Promise<UserType>;
}) => {
  const initialUser = use(initialValue);
  useEffect(() => {
    Object.assign(userObject, initialUser);
  });
  useEffect(() => {
    (async () => {
      Object.assign(userObject, await initialValue);
      Object.assign(userObject, await getUserData());
    })();
  }, [initialValue]);
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      Object.assign(userObject, await getUserData());
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return children;
};

export async function getUserData() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      role: null,
      nickname: null,
    };
  }

  const { data } = await supabase.from('users').select('role, nickname').eq('id', user.id).single();
  return {
    role: data?.role || null,
    nickname: data?.nickname || null,
  };
}

export const useUser = () => {
  return useSnapshot(userObject);
};
