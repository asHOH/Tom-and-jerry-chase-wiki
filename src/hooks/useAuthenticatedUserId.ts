'use client';

import { useEffect, useState } from 'react';

import { getOptionalSupabaseBrowserClient } from '@/lib/supabase/browserClient';

/** Verify the current identity instead of trusting the persisted profile cache. */
export function useAuthenticatedUserId(enabled = true) {
  const [identity, setIdentity] = useState<{ userId: string | null; isLoading: boolean }>({
    userId: null,
    isLoading: true,
  });

  useEffect(() => {
    const client = enabled ? getOptionalSupabaseBrowserClient() : undefined;
    if (!client) {
      setIdentity({ userId: null, isLoading: false });
      return;
    }
    let revision = 0;
    let active = true;
    let verifiedUserId: string | null = null;
    const verify = async () => {
      const current = ++revision;
      try {
        const { data, error } = await client.auth.getClaims();
        if (active && current === revision) {
          verifiedUserId = error ? null : (data?.claims.sub ?? null);
          setIdentity({ userId: verifiedUserId, isLoading: false });
        }
      } catch {
        if (active && current === revision) setIdentity({ userId: null, isLoading: false });
      }
    };
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (session && session.user.id === verifiedUserId) return;
      // Clear old-account UI before asynchronously checking the new identity.
      ++revision;
      verifiedUserId = null;
      setIdentity({ userId: null, isLoading: Boolean(session) });
      if (session) {
        // Auth callbacks run under the auth lock; verify only after it is released.
        queueMicrotask(() => void verify());
      }
    });
    void verify();
    return () => {
      active = false;
      ++revision;
      subscription.unsubscribe();
    };
  }, [enabled]);

  return identity;
}
