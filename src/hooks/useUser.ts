'use client';

import { useEffect, ReactNode, use, useRef } from 'react';
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

const applyUserData = (data: UserType, { allowEmpty = false }: { allowEmpty?: boolean } = {}) => {
  if (!allowEmpty && !data.nickname && !data.role) {
    return;
  }
  Object.assign(userObject, data);
};

export const UserProvider = ({
  children,
  initialValue,
}: {
  children: ReactNode;
  initialValue: Promise<UserType>;
}) => {
  'use no memo';
  const initialUser = use(initialValue);
  const hasAppliedInitial = useRef(false);
  if (!hasAppliedInitial.current) {
    applyUserData(initialUser, { allowEmpty: true });
    hasAppliedInitial.current = true;
  }
  useEffect(() => {
    applyUserData(initialUser, { allowEmpty: true });
  });
  useEffect(() => {
    (async () => {
      applyUserData(await initialValue, { allowEmpty: true });
      const clientUser = await getUserData();
      const shouldAllowEmpty = !userObject.nickname && !userObject.role;
      applyUserData(clientUser, { allowEmpty: shouldAllowEmpty });
    })();
  }, [initialValue]);
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
