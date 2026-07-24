import { NextResponse } from 'next/server';

import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { getUserBlockSummary } from '@/lib/blocks/server';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ nickname: null, grants: [], groups: [], blockSummary: [] });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return NextResponse.json({ nickname: null, grants: [], groups: [], blockSummary: [] });
  }

  const [{ data, error }, grants, { data: memberships }] = await Promise.all([
    supabase.from('users').select('nickname').eq('id', userId).single(),
    loadPermissionGrants(supabase),
    supabase.from('user_group_memberships').select('group_id').eq('user_id', userId),
  ]);

  if (error) {
    return NextResponse.json(
      { nickname: null, grants: [], groups: [], blockSummary: [] },
      { status: 200 }
    );
  }

  const groupIds = memberships?.map(({ group_id }) => group_id) ?? [];
  const { data: groups } = groupIds.length
    ? await supabase.from('user_groups').select('id, name').in('id', groupIds)
    : { data: [] };

  const blockSummary = await getUserBlockSummary(userId, request);
  return NextResponse.json({
    nickname: data?.nickname ?? null,
    grants,
    groups: groups ?? [],
    blockSummary,
  });
}
