import { NextRequest, NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/requireRole';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'synced', 'all'] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function GET(request: NextRequest) {
  try {
    const guard = await requireRole(['Reviewer', 'Coordinator']);
    if ('error' in guard) return guard.error;

    const { searchParams } = new URL(request.url);
    const statusParam = (searchParams.get('status') ?? 'all').trim() as AllowedStatus;

    const status: AllowedStatus = ALLOWED_STATUSES.includes(statusParam) ? statusParam : 'all';

    let query = supabaseAdmin
      .from('game_data_actions')
      .select(
        'id, created_at, created_by, entity_type, entry, is_public, message, pr_url, rejection_reason, reviewed_at, reviewed_by, status'
      )
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching admin game data actions:', error);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    const rows = data ?? [];

    const userIds = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.created_by, row.reviewed_by])
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    );

    const nicknameByUserId = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users_public_view')
        .select('id, nickname')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users_public_view for nicknames:', usersError);
        return NextResponse.json({ error: 'Failed to fetch user nicknames' }, { status: 500 });
      }

      for (const u of users ?? []) {
        if (u.id && u.nickname) nicknameByUserId.set(u.id, u.nickname);
      }
    }

    const submissions = rows.map((row) => {
      const createdByNickname = row.created_by ? (nicknameByUserId.get(row.created_by) ?? '') : '';
      const reviewedByNickname = row.reviewed_by
        ? (nicknameByUserId.get(row.reviewed_by) ?? '')
        : '';

      return {
        action_id: row.id,
        created_at: row.created_at,
        created_by: row.created_by ?? '',
        created_by_nickname: createdByNickname,
        entity_type: row.entity_type,
        entry: row.entry,
        is_public: row.is_public,
        message: row.message,
        pr_url: row.pr_url,
        rejection_reason: row.rejection_reason ?? '',
        reviewed_at: row.reviewed_at ?? '',
        reviewed_by: row.reviewed_by ?? '',
        reviewed_by_nickname: reviewedByNickname,
        status: row.status,
      };
    });

    return NextResponse.json({ submissions, count: submissions.length, status });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
