'use client';

import { useEffect, ReactNode } from 'react';
import { proxy, useSnapshot } from 'valtio';

type UserType = { role: string | null; nickname: string | null };

const userObject = proxy<UserType & { clearData: () => void }>({
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
  useEffect(() => {
    (async () => {
      Object.assign(userObject, await initialValue);
    })();
  }, [initialValue]);
  return children;
};

export const useUser = () => {
  return useSnapshot(userObject);
};
