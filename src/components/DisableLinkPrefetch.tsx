'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Disable Next.js Link prefetching to cut down additional edge requests.
 * Applied only on Vercel via conditional rendering in the root layout.
 */
export function DisableLinkPrefetch() {
  const router = useRouter();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routerWithPrefetch = router as any;
    const originalPrefetch = routerWithPrefetch.prefetch;

    // Safe to override in this runtime: we only need to short-circuit Link prefetch.
    // eslint-disable-next-line react-hooks/immutability
    routerWithPrefetch.prefetch = () => Promise.resolve();

    return () => {
      routerWithPrefetch.prefetch = originalPrefetch;
    };
  }, [router]);

  return null;
}
