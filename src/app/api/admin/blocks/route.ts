import { isIP } from 'node:net';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getAllStaticPermissionResourceOptions } from '@/lib/auth/permissionResources';
import { requirePermission } from '@/lib/auth/requirePermission';
import { BLOCK_ACTIONS, isValidBlockAction } from '@/lib/blocks/types';
import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';
import type { Json } from '@/data/database.types';

const restrictionSchema = z
  .object({
    action: z.enum(BLOCK_ACTIONS),
    resourceType: z.string().trim().min(1).max(100).nullable(),
    resourceId: z.string().trim().min(1).max(200).nullable(),
  })
  .refine((value) => (value.resourceType === null) === (value.resourceId === null), {
    message: 'Resource type and resource ID must be provided together',
  });

const createSchema = z.object({
  targetType: z.enum(['account', 'ip', 'range']),
  targetUserId: z.string().uuid().nullable().optional(),
  targetCidr: z.string().trim().min(1).max(80).nullable().optional(),
  reason: z.string().trim().min(1).max(1000),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  hardBlock: z.boolean().default(false),
  autoblock: z.boolean().default(true),
  restrictions: z.array(restrictionSchema).min(1).max(100),
});

const normalizeTargetCidr = (targetType: 'account' | 'ip' | 'range', raw: string | null) => {
  if (targetType === 'account') return null;
  if (!raw) return null;
  const parts = raw.split('/');
  const address = parts[0];
  const mask = parts[1];
  if (!address || isIP(address) === 0) return null;
  if (targetType === 'ip') {
    return parts.length === 1 ? `${address}/${isIP(address) === 4 ? 32 : 128}` : null;
  }
  if (parts.length !== 2) return null;
  const parsedMask = Number(mask);
  const maxMask = isIP(address) === 4 ? 32 : 128;
  if (!Number.isInteger(parsedMask) || parsedMask < 0 || parsedMask > maxMask) return null;
  return `${address}/${parsedMask}`;
};

const loadResourceOptions = async () => {
  const [{ data: articles }, { data: categories }] = await Promise.all([
    requireSupabaseAdminClient().from('articles').select('id, title').order('title').limit(1000),
    requireSupabaseAdminClient().from('categories').select('id, name').order('name').limit(1000),
  ]);
  return {
    ...getAllStaticPermissionResourceOptions(),
    articles: (articles ?? []).map((item) => ({ id: item.id, label: item.title })),
    categories: (categories ?? []).map((item) => ({ id: item.id, label: item.name })),
    'comments/articles': (articles ?? []).map((item) => ({ id: item.id, label: item.title })),
  };
};

export async function GET(request: Request) {
  const guard = await requirePermission(['block.view', 'block.manage']);
  if ('error' in guard) return guard.error;

  const url = new URL(request.url);
  const status = url.searchParams.get('status') === 'history' ? 'history' : 'active';
  const search = url.searchParams.get('search')?.trim().toLowerCase() ?? '';
  const [{ data, error }, resourceOptions, { data: allUsers }, { data: logRows, error: logError }] =
    await Promise.all([
      requireSupabaseAdminClient()
        .from('blocks')
        .select(
          'id, target_type, target_user_id, target_cidr, reason, created_by, created_at, expires_at, revoked_at, revoked_by, is_autoblock, autoblock_enabled, parent_block_id, hard_block, block_restrictions(action, resource_type, resource_id)'
        )
        .order('created_at', { ascending: false })
        .limit(1000),
      loadResourceOptions(),
      requireSupabaseAdminClient()
        .from('users')
        .select('id, nickname')
        .order('nickname')
        .limit(5000),
      requireSupabaseAdminClient()
        .from('block_log')
        .select('id, block_id, event_type, actor_id, reason, snapshot, created_at')
        .order('created_at', { ascending: false })
        .limit(2000),
    ]);
  if (error || logError)
    return NextResponse.json({ error: 'Failed to load block history' }, { status: 500 });

  const rows = data ?? [];
  const logs = logRows ?? [];
  const isActive = (row: (typeof rows)[number]) =>
    !row.revoked_at && (!row.expires_at || new Date(row.expires_at).getTime() > Date.now());
  const userIds = [
    ...new Set([
      ...rows.flatMap((row) => [row.target_user_id, row.created_by, row.revoked_by]),
      ...logs.map((log) => log.actor_id),
    ]),
  ].filter((id): id is string => Boolean(id));
  const { data: users } = userIds.length
    ? await requireSupabaseAdminClient().from('users').select('id, nickname').in('id', userIds)
    : { data: [] };
  const nicknameById = new Map((users ?? []).map((user) => [user.id, user.nickname]));

  const blocks = rows
    .filter((row) => status === 'history' || isActive(row))
    .filter((row) => {
      if (!search) return true;
      return [
        row.id,
        row.target_cidr ?? '',
        row.reason,
        row.target_user_id ? (nicknameById.get(row.target_user_id) ?? '') : '',
      ].some((value) => value.toLowerCase().includes(search));
    })
    .map((row) => ({
      id: row.id,
      targetType: row.target_type,
      targetUserId: row.target_user_id,
      targetNickname: row.target_user_id ? (nicknameById.get(row.target_user_id) ?? null) : null,
      targetCidr: row.target_cidr,
      reason: row.reason,
      createdBy: row.created_by,
      createdByNickname: nicknameById.get(row.created_by) ?? null,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      revokedBy: row.revoked_by,
      revokedByNickname: row.revoked_by ? (nicknameById.get(row.revoked_by) ?? null) : null,
      isAutoblock: row.is_autoblock,
      autoblockEnabled: row.autoblock_enabled,
      parentBlockId: row.parent_block_id,
      hardBlock: row.hard_block,
      active: isActive(row),
      restrictions: row.block_restrictions.map((restriction) => ({
        action: isValidBlockAction(restriction.action) ? restriction.action : 'edit',
        resourceType: restriction.resource_type,
        resourceId: restriction.resource_id,
      })),
    }));

  return NextResponse.json({
    blocks,
    logs: logs.map((log) => ({
      id: log.id,
      blockId: log.block_id,
      eventType: log.event_type,
      actorId: log.actor_id,
      actorNickname: log.actor_id ? (nicknameById.get(log.actor_id) ?? null) : null,
      reason: log.reason,
      snapshot: log.snapshot,
      createdAt: log.created_at,
    })),
    resourceOptions,
    users: (allUsers ?? []).map((user) => ({ id: user.id, nickname: user.nickname })),
  });
}

export async function POST(request: Request) {
  const guard = await requirePermission('block.manage');
  if ('error' in guard) return guard.error;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  const input = parsed.data;
  const targetCidr = normalizeTargetCidr(input.targetType, input.targetCidr ?? null);
  if (input.targetType !== 'account' && !targetCidr) {
    return NextResponse.json({ error: 'Invalid IP or CIDR range' }, { status: 400 });
  }
  if (input.targetType === 'account' && !input.targetUserId) {
    return NextResponse.json({ error: 'Target account is required' }, { status: 400 });
  }

  const { data: blockId, error } = await guard.supabase.rpc('create_block', {
    p_target_type: input.targetType,
    p_target_user_id: input.targetUserId ?? null,
    p_target_cidr: targetCidr,
    p_reason: input.reason,
    p_expires_at: input.expiresAt ?? null,
    p_hard_block: input.hardBlock,
    p_autoblock: input.targetType === 'account' ? input.autoblock : false,
    p_restrictions: input.restrictions as unknown as Json,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: blockId }, { status: 201 });
}
