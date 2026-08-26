import 'server-only';

import { cache } from 'react';

import { loadPermissionGrants } from './auth/requirePermission';
import { getUserBlockSummary } from './blocks/server';
import { hasSupabasePublicConfig } from './supabase/config';
import { createClient } from './supabase/server';

const CURRENT_USER_CONTEXT_REVALIDATE_SECONDS = 60;

type CurrentUserContext = {
  userId: string | null;
  nickname: string | null;
  grants: Awaited<ReturnType<typeof loadPermissionGrants>>;
  groups: Array<{ id: string; name: string }>;
  blockSummary: Awaited<ReturnType<typeof getUserBlockSummary>>;
};

const EMPTY_CURRENT_USER_CONTEXT: CurrentUserContext = {
  userId: null,
  nickname: null,
  grants: [],
  groups: [],
  blockSummary: [],
};

type CurrentUserContextCacheEntry = {
  expiresAt: number;
  acquisition: Promise<CurrentUserContext>;
};

const currentUserContextCache = new Map<string, CurrentUserContextCacheEntry>();

function loadCurrentUserContext(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CurrentUserContext> {
  const now = Date.now();
  const cachedEntry = currentUserContextCache.get(userId);
  if (cachedEntry && cachedEntry.expiresAt > now) return cachedEntry.acquisition;

  const acquisition = (async () => {
    const [{ data }, grants, { data: memberships }] = await Promise.all([
      supabase.from('users').select('nickname').eq('id', userId).single(),
      loadPermissionGrants(supabase),
      supabase.from('user_group_memberships').select('group_id').eq('user_id', userId),
    ]);
    const groupIds = memberships?.map(({ group_id }) => group_id) ?? [];
    const { data: groups } = groupIds.length
      ? await supabase.from('user_groups').select('id, name').in('id', groupIds)
      : { data: [] };

    return {
      userId,
      nickname: data?.nickname || null,
      grants,
      groups: groups ?? [],
      blockSummary: await getUserBlockSummary(userId),
    };
  })();
  const entry = {
    expiresAt: now + CURRENT_USER_CONTEXT_REVALIDATE_SECONDS * 1000,
    acquisition,
  };
  currentUserContextCache.set(userId, entry);
  void acquisition.catch(() => {
    if (currentUserContextCache.get(userId) === entry) currentUserContextCache.delete(userId);
  });
  return acquisition;
}

const readCurrentUserContext = cache(async (): Promise<CurrentUserContext> => {
  if (!hasSupabasePublicConfig()) {
    return EMPTY_CURRENT_USER_CONTEXT;
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return EMPTY_CURRENT_USER_CONTEXT;
  }

  return loadCurrentUserContext(userId, supabase);
});

export async function getCurrentUserContext(): Promise<CurrentUserContext> {
  return readCurrentUserContext();
}

export async function getUserData() {
  const { userId: _userId, ...userData } = await getCurrentUserContext();
  return userData;
}
