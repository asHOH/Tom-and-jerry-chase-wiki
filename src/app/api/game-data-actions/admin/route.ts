import { NextRequest, NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import type { GameDataActionStatusFilter } from '@/lib/gameData/adminActionTypes';
import {
  isPublishableEntityType,
  type PublishableEntityType,
} from '@/lib/gameData/publishableEntityTypes';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';

const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'synced', 'revoked', 'all'] as const;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE = 10_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function errorResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isAllowedStatus(value: string): value is GameDataActionStatusFilter {
  return (ALLOWED_STATUSES as readonly string[]).includes(value);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function queryShape(options: {
  actionId: boolean;
  entityType: boolean;
  page: number;
  status: GameDataActionStatusFilter;
}): string {
  if (options.actionId) return 'admin-game-data-actions:list:exact-id';
  const filter =
    options.status === 'all'
      ? options.entityType
        ? 'entity-all-status'
        : 'unfiltered-all-status'
      : options.entityType
        ? 'status-and-entity'
        : 'status';
  return `admin-game-data-actions:list:${filter}:${options.page === 1 ? 'first-page' : 'offset-page'}`;
}

function logTiming(shape: string, startedAt: number, rowCount: number, success: boolean): void {
  console.info(
    JSON.stringify({
      queryShape: shape,
      durationMs: Math.round((performance.now() - startedAt) * 100) / 100,
      rowCount,
      success,
    })
  );
}

export async function GET(request: NextRequest) {
  const startedAt = performance.now();
  let shape = 'admin-game-data-actions:list:invalid';
  let rowCount = 0;
  let timingLogged = false;

  try {
    const guard = await requirePermission([
      'game_data_action.approve',
      'game_data_action.reject',
      'game_data_action.mark_synced',
      'game_data_action.revoke',
    ]);
    if ('error' in guard) return guard.error;
    const { supabase } = guard;

    const { searchParams } = new URL(request.url);
    const actionId = searchParams.get('actionId')?.trim() ?? null;

    if (actionId !== null) {
      shape = queryShape({ actionId: true, entityType: false, page: 1, status: 'pending' });
      if (!isUuid(actionId)) return errorResponse('Invalid action ID');

      const { data, error } = await supabase
        .from('game_data_actions')
        .select(
          'id, created_at, created_by, entity_type, is_public, message, rejection_reason, reviewed_at, reviewed_by, status'
        )
        .eq('id', actionId)
        .limit(1);

      if (error) {
        console.error('Error fetching admin game data action by ID:', error);
        return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
      }

      const response = {
        ...(await createResponse(data ?? [])),
        currentPage: data?.length ? 1 : 0,
        totalPages: data?.length ? 1 : 0,
        totalCount: data?.length ?? 0,
      };
      rowCount = response.submissions.length;
      logTiming(shape, startedAt, rowCount, true);
      timingLogged = true;
      return NextResponse.json(response);
    }

    const statusParam = (searchParams.get('status') ?? 'pending').trim();
    if (!isAllowedStatus(statusParam)) return errorResponse('Invalid action status');
    const status = statusParam;

    const entityTypeParam = searchParams.get('entityType')?.trim() ?? null;
    if (entityTypeParam !== null && !isPublishableEntityType(entityTypeParam)) {
      return errorResponse('Invalid entity type');
    }
    const entityType = entityTypeParam as PublishableEntityType | null;

    const pageParam = searchParams.get('page');
    const page = pageParam === null ? 1 : Number(pageParam);
    if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) {
      return errorResponse(`Page must be between 1 and ${MAX_PAGE}`);
    }

    shape = queryShape({
      actionId: false,
      entityType: entityType !== null,
      page,
      status,
    });

    let query = supabase
      .from('game_data_actions')
      .select(
        'id, created_at, created_by, entity_type, is_public, message, rejection_reason, reviewed_at, reviewed_by, status',
        { count: 'exact' }
      );

    if (status !== 'all') query = query.eq('status', status);
    if (entityType !== null) query = query.eq('entity_type', entityType);

    const rangeFrom = (page - 1) * DEFAULT_PAGE_SIZE;
    const rangeTo = rangeFrom + DEFAULT_PAGE_SIZE - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(rangeFrom, rangeTo);

    if (error) {
      console.error('Error fetching admin game data actions:', error);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }
    if (count === null) {
      console.error('Exact count missing from admin game data actions response');
      return NextResponse.json({ error: 'Failed to count actions' }, { status: 500 });
    }

    const response = {
      ...(await createResponse(data ?? [])),
      currentPage: count === 0 ? 0 : page,
      totalPages: Math.ceil(count / DEFAULT_PAGE_SIZE),
      totalCount: count,
    };

    rowCount = response.submissions.length;
    logTiming(shape, startedAt, rowCount, true);
    timingLogged = true;
    return NextResponse.json(response);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    if (!timingLogged) logTiming(shape, startedAt, rowCount, false);
  }
}

type SummaryRow = {
  id: string;
  created_at: string;
  created_by: string | null;
  entity_type: string;
  is_public: boolean;
  message: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'synced' | 'revoked';
};

async function createResponse(rows: SummaryRow[]) {
  const userIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.created_by, row.reviewed_by])
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  );

  const nicknameByUserId = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users, error: usersError } = await requireSupabaseAdminClient()
      .from('users_public_view')
      .select('id, nickname')
      .in('id', userIds);

    if (usersError) throw usersError;
    for (const user of users ?? []) {
      if (user.id && user.nickname) nicknameByUserId.set(user.id, user.nickname);
    }
  }

  return {
    submissions: rows.map((row) => ({
      action_id: row.id,
      created_at: row.created_at,
      created_by: row.created_by ?? '',
      created_by_nickname: row.created_by ? (nicknameByUserId.get(row.created_by) ?? '') : '',
      entity_type: row.entity_type,
      is_public: row.is_public,
      message: row.message,
      rejection_reason: row.rejection_reason ?? '',
      reviewed_at: row.reviewed_at ?? '',
      reviewed_by: row.reviewed_by ?? '',
      reviewed_by_nickname: row.reviewed_by ? (nicknameByUserId.get(row.reviewed_by) ?? '') : '',
      status: row.status,
    })),
  };
}
