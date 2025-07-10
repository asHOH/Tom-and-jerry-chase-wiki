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

  const navigateWithOfflineCheck = useCallback(
    async (targetPath: string) => {
      await navigateUtil(targetPath, (path) => router.push(path));
    },
    [router]
  );

  return { navigateWithOfflineCheck };
};
