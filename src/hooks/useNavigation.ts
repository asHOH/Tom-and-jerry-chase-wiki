'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { navigate as navigateUtil } from '../lib/navigationUtils';

/**
 * Custom hook for handling offline-aware navigation
 * Checks cache availability before navigation when offline
 */
export const useNavigation = () => {
  const router = useRouter();

  const navigate = useCallback(
    async (targetPath: string, options?: { replace?: boolean }): Promise<boolean> => {
      return await navigateUtil(targetPath, (path) => {
        if (options?.replace) {
          router.replace(path);
        } else {
          router.push(path);
        }
      });
    },
    [router]
  );

  return { navigate };
};
