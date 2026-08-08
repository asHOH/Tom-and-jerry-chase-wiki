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
const MAX_PAGE_SIZE = 100;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/;

type CursorPayload = {
  version: 1;
  createdAt: string;
  id: string;
  status: GameDataActionStatusFilter;
  entityType: PublishableEntityType | null;
};

function errorResponse(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function isAllowedStatus(value: string): value is GameDataActionStatusFilter {
  return (ALLOWED_STATUSES as readonly string[]).includes(value);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function decodeCursor(
  encoded: string,
  filters: { status: GameDataActionStatusFilter; entityType: PublishableEntityType | null }
): CursorPayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as unknown;
    if (parsed === null || typeof parsed !== 'object') return null;

    const cursor = parsed as Partial<CursorPayload>;
    if (
      cursor.version !== 1 ||
      typeof cursor.createdAt !== 'string' ||
      !ISO_TIMESTAMP_PATTERN.test(cursor.createdAt) ||
      Number.isNaN(Date.parse(cursor.createdAt)) ||
      typeof cursor.id !== 'string' ||
      !isUuid(cursor.id) ||
      cursor.status !== filters.status ||
      cursor.entityType !== filters.entityType
    ) {
      return null;
    }

    return cursor as CursorPayload;
  } catch {
    return null;
  }
}

function queryShape(options: {
  actionId: boolean;
  cursor: boolean;
  entityType: boolean;
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
  return `admin-game-data-actions:list:${filter}:${options.cursor ? 'cursor-page' : 'first-page'}`;
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
      shape = queryShape({ actionId: true, cursor: false, entityType: false, status: 'pending' });
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

      const response = await createResponse(data ?? []);
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

    const limitParam = searchParams.get('limit');
    const limit = limitParam === null ? DEFAULT_PAGE_SIZE : Number(limitParam);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE) {
      return errorResponse(`Limit must be between 1 and ${MAX_PAGE_SIZE}`);
    }

    const cursorParam = searchParams.get('cursor');
    const cursor = cursorParam === null ? null : decodeCursor(cursorParam, { status, entityType });
    if (cursorParam !== null && cursor === null) return errorResponse('Invalid cursor');

    shape = queryShape({
      actionId: false,
      cursor: cursor !== null,
      entityType: entityType !== null,
      status,
    });

    let query = supabase
      .from('game_data_actions')
      .select(
        'id, created_at, created_by, entity_type, is_public, message, rejection_reason, reviewed_at, reviewed_by, status'
      );

    if (status !== 'all') query = query.eq('status', status);
    if (entityType !== null) query = query.eq('entity_type', entityType);
    if (cursor !== null) {
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
      );
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (error) {
      console.error('Error fetching admin game data actions:', error);
      return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });
    }

    const rows = data ?? [];
    const pageRows = rows.slice(0, limit);
    const response = await createResponse(pageRows);
    const lastRow = pageRows.at(-1);
    response.nextCursor =
      rows.length > limit && lastRow
        ? encodeCursor({
            version: 1,
            createdAt: lastRow.created_at,
            id: lastRow.id,
            status,
            entityType,
          })
        : null;

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
    nextCursor: null as string | null,
  };
}
