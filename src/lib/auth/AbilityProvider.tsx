'use client';

import { useMemo, type ReactNode } from 'react';
import { AbilityProvider as CaslAbilityProvider } from '@casl/react';

import { abilityFor, type AppAbility, type Role } from '@/lib/auth/permissions';
import { useUser } from '@/hooks/useUser';

/**
 * Provides a CASL `AppAbility` to all descendant components, built from the
 * current user's role (obtained via `useUser()`).
 *
 * Must be placed inside `<UserProvider>` so that `useUser()` is available.
 */
export function AbilityProvider({ children }: { children: ReactNode }) {
  const { role } = useUser();
  const ability: AppAbility = useMemo(() => abilityFor(role as Role | null), [role]);

  return <CaslAbilityProvider value={ability}>{children}</CaslAbilityProvider>;
}

// Re-export convenience hooks from @casl/react so consumers only need a single import.
export { useAbility } from '@casl/react';
