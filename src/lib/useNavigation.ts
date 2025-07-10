'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { navigate as navigateUtil } from './navigationUtils';

/**
 * Custom hook for handling offline-aware navigation
 * Checks cache availability before navigation when offline
 */
export const useNavigation = () => {
  const router = useRouter();

  const navigate = useCallback(
    async (targetPath: string): Promise<boolean> => {
      return await navigateUtil(targetPath, (path) => router.push(path));
    },
    [router]
  );

  return { navigate };
};
