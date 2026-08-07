import 'server-only';

import { isIP } from 'node:net';

import { getClientIp } from '@/lib/requestIp';
import { getOptionalSupabaseAdminClient } from '@/lib/supabase/adminClient';

import {
  BLOCK_ACTIONS,
  type BlockAction,
  type BlockInfo,
  type BlockResourceContext,
} from './types';

type EffectiveBlockRow = {
  id: string;
  reason: string;
  expires_at: string | null;
  is_autoblock: boolean;
  target_type: string;
  hard_block: boolean;
  parent_block_id: string | null;
};

export const normalizeIp = (value: string | null | undefined): string | null => {
  const candidate = value?.trim();
  return candidate && isIP(candidate) !== 0 ? candidate : null;
};

export const getRequestIp = (request: Request): string | null => normalizeIp(getClientIp(request));

const getFirstBlock = async (
  userId: string | null,
  ip: string | null,
  action: BlockAction,
  context?: BlockResourceContext
): Promise<BlockInfo | null> => {
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.rpc('find_effective_block', {
    p_action: action,
    ...(userId ? { p_user_id: userId } : {}),
    ...(ip ? { p_ip: ip } : {}),
    ...(context?.resourceType ? { p_resource_type: context.resourceType } : {}),
    ...(context?.resourceId ? { p_resource_id: context.resourceId } : {}),
  });
  if (error) {
    console.error('Failed to resolve active block:', error);
    return null;
  }
  const row = (data as EffectiveBlockRow[] | null)?.[0];
  if (!row) return null;
  return {
    id: row.id,
    reason: row.reason,
    expiresAt: row.expires_at,
    isAutoblock: row.is_autoblock,
    targetType: row.target_type,
    hardBlock: row.hard_block,
    parentBlockId: row.parent_block_id,
    action,
    resourceType: context?.resourceType ?? null,
    resourceId: context?.resourceId ?? null,
  };
};

export const getActiveBlock = async ({
  request,
  userId,
  action,
  contexts = [{}],
  createAutoblock = true,
}: {
  request?: Request | undefined;
  userId: string | null;
  action: BlockAction;
  contexts?: readonly BlockResourceContext[] | undefined;
  createAutoblock?: boolean;
}): Promise<BlockInfo | null> => {
  const ip = request ? normalizeIp(getClientIp(request)) : null;
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (
    createAutoblock &&
    userId &&
    ip &&
    (action === 'edit' || action === 'upload') &&
    supabaseAdmin
  ) {
    const { error } = await supabaseAdmin.rpc('create_autoblock_for_request', {
      p_user_id: userId,
      p_ip: ip,
      p_action: action,
    });
    if (error) console.error('Failed to create request autoblock:', error);
  }

  for (const context of contexts.length > 0 ? contexts : [{}]) {
    const block = await getFirstBlock(userId, ip, action, context);
    if (block) return block;
  }
  return null;
};

export const recordUserIp = async (userId: string, request: Request): Promise<void> => {
  const ip = normalizeIp(getClientIp(request));
  const supabaseAdmin = getOptionalSupabaseAdminClient();
  if (!ip || !supabaseAdmin) return;
  const { error } = await supabaseAdmin.rpc('record_user_last_ip', {
    p_user_id: userId,
    p_ip: ip,
  });
  if (error) console.error('Failed to record user IP:', error);
};

export const getUserBlockSummary = async (
  userId: string,
  request?: Request | undefined
): Promise<
  Array<{
    action: BlockAction;
    reason: string;
    expiresAt: string | null;
    isAutoblock: boolean;
    blockId: string;
  }>
> => {
  const summary: Array<{
    action: BlockAction;
    reason: string;
    expiresAt: string | null;
    isAutoblock: boolean;
    blockId: string;
  }> = [];
  for (const action of BLOCK_ACTIONS) {
    const block = await getActiveBlock({ request, userId, action, createAutoblock: false });
    if (!block) continue;
    summary.push({
      action,
      reason: block.reason,
      expiresAt: block.expiresAt,
      isAutoblock: block.isAutoblock,
      blockId: block.id,
    });
  }
  return summary;
};
