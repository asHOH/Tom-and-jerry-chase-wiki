import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { abilityFor, type Action, type AppAbility, type Role, type Subject } from './permissions';

type RequireAbilitySuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  ability: AppAbility;
};

type RequireAbilityResult =
  | RequireAbilitySuccess
  | { error: NextResponse; supabase?: never; userId?: never; ability?: never };

/**
 * Authenticate the current user and check whether they have the given
 * permission.  Replaces the old `requireRole(allowed)` pattern with a CASL
 * ability check.
 *
 * Returns `{ supabase, userId, ability }` on success so callers can perform
 * additional ownership or conditional checks.
 */
export async function requireAbility(
  action: Action,
  subject: Subject
): Promise<RequireAbilityResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', userId).single();

  const role = (roleData?.role as Role | undefined) ?? null;
  const ability = abilityFor(role, userId);

  if (!ability.can(action, subject)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }

  return { supabase, userId, ability } as const;
}
