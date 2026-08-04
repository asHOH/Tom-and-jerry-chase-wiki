import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import {
  loadTrustedGameDataAction,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const { actionId } = await params;
    const action = await loadTrustedGameDataAction(actionId);
    const contexts = getGameActionResourceContexts(action.entity_type, [action.entry]);
    const guard = await requirePermission('game_data_action.view_votes', contexts, 'all');
    if ('error' in guard) return guard.error;

    const { data: votes, error } = await supabaseAdmin
      .from('game_data_action_votes')
      .select('voter_id, choice, created_at, updated_at')
      .eq('action_id', actionId)
      .order('updated_at', { ascending: true });
    if (error) {
      console.error('Failed to audit game data votes:', error);
      return NextResponse.json({ error: 'Failed to load votes' }, { status: 500 });
    }
    const voterIds = (votes ?? []).map(({ voter_id }) => voter_id);
    const { data: users } = voterIds.length
      ? await supabaseAdmin.from('users_public_view').select('id, nickname').in('id', voterIds)
      : { data: [] };
    const nicknames = new Map((users ?? []).map((user) => [user.id, user.nickname]));
    return NextResponse.json({
      votes: (votes ?? []).map((vote) => ({
        choice: vote.choice,
        nickname: nicknames.get(vote.voter_id) ?? null,
        createdAt: vote.created_at,
        updatedAt: vote.updated_at,
      })),
    });
  } catch (error) {
    if (error instanceof TrustedGameDataMutationError && error.code === 'not_found') {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }
    console.error('Vote audit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
