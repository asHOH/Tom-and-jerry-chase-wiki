'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { navigate as navigateUtil } from '../lib/navigationUtils';
import { setNavigationTarget } from './useNavigationProgress';

/**
 * Custom hook for handling offline-aware navigation
 * Checks cache availability before navigation when offline
 */
export const useNavigation = () => {
  const router = useRouter();

  const navigate = useCallback(
    async (targetPath: string, options?: { replace?: boolean }): Promise<boolean> => {
      setNavigationTarget(targetPath);
      const ok = await navigateUtil(targetPath, (path) => {
        if (options?.replace) {
          router.replace(path);
        } else {
          router.push(path);
        }
      });
      if (!ok) {
        setNavigationTarget(null);
      }
      return ok;
    },
    [router]
  );

  return { navigate };
};
