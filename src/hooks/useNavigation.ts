'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { navigate as navigateUtil } from '../lib/navigationUtils';
import { setNavigationTarget } from './useNavigationProgress';

/**
 * Custom hook for handling offline-aware navigation
 * Uses the Next.js router online and lets the service worker handle document requests offline.
 */
export const useNavigation = () => {
  const router = useRouter();

  const navigate = useCallback(
    async (targetPath: string, options?: { replace?: boolean }): Promise<boolean> => {
      setNavigationTarget(targetPath);
      navigateUtil(
        targetPath,
        (path) => {
          if (options?.replace) {
            router.replace(path);
          } else {
            router.push(path);
          }
        },
        (path) => {
          if (options?.replace) {
            window.location.replace(path);
          } else {
            window.location.assign(path);
          }
        }
      );
      return true;
    },
    [router]
  );

  return { navigate };
};
