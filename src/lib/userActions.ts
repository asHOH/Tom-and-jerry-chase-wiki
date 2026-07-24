'use server';

import { loadPermissionGrants } from './auth/requirePermission';
import { getUserBlockSummary } from './blocks/server';
import { hasSupabasePublicConfig } from './supabase/config';
import { createClient } from './supabase/server';

export async function getUserData() {
  if (!hasSupabasePublicConfig()) {
    return { nickname: null, grants: [], groups: [], blockSummary: [] };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return { nickname: null, grants: [], groups: [], blockSummary: [] };
  }

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
    nickname: data?.nickname || null,
    grants,
    groups: groups ?? [],
    blockSummary: await getUserBlockSummary(userId),
  };
}
