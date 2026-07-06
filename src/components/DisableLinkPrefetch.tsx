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
    type RouterPrefetch = typeof router.prefetch;

    const originalPrefetch = router.prefetch;
    const disabledPrefetch: RouterPrefetch = () => {};

    // Safe to override in this runtime: we only need to short-circuit Link prefetch.
    // oxlint-disable-next-line react-hooks/immutability
    router.prefetch = disabledPrefetch;

    return () => {
      router.prefetch = originalPrefetch;
    };
  }, [router]);

  return null;
}
