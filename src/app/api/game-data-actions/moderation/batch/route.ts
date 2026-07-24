import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getRequestIp } from '@/lib/blocks/server';
import {
  approvePreparedGameDataAction,
  loadTrustedGameDataAction,
  TrustedGameDataMutationError,
  type TrustedGameDataActionRecord,
} from '@/lib/gameData/trustedGameDataMutations';
import { publishNotification } from '@/lib/notificationUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

const schema = z.object({
  actionIds: z.array(z.uuid()).min(1).max(200),
  action: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const requiredPermission =
    parsed.data.action === 'approve' ? 'game_data_action.approve' : 'game_data_action.reject';
  const guard = await requirePermission(requiredPermission, undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;
  const { actionIds, action, reason } = parsed.data;
  const recordsById = new Map<string, TrustedGameDataActionRecord>();
  const failures: Array<{ actionId: string; message: string }> = [];

  for (const actionId of actionIds) {
    try {
      const record = await loadTrustedGameDataAction(actionId);
      if (record.status !== 'pending') {
        failures.push({ actionId, message: 'Action not found or not pending' });
      } else {
        recordsById.set(actionId, record);
      }
    } catch (error) {
      if (error instanceof TrustedGameDataMutationError && error.code === 'not_found') {
        failures.push({ actionId, message: 'Action not found or not pending' });
        continue;
      }
      return NextResponse.json({ error: 'Failed to load actions' }, { status: 500 });
    }
  }

  const contexts = [...recordsById.values()].flatMap((record) =>
    getGameActionResourceContexts(record.entity_type, [record.entry])
  );
  const resourceGuard = await requirePermission(requiredPermission, contexts, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in resourceGuard) return resourceGuard.error;

  const succeeded: string[] = [];
  for (const actionId of actionIds) {
    const record = recordsById.get(actionId);
    if (!record) continue;

    try {
      if (action === 'approve') {
        await approvePreparedGameDataAction(guard.userId, record, getRequestIp(request));
      } else {
        const { error } = await supabaseAdmin.rpc('prepared_reject_game_data_action', {
          p_actor_id: guard.userId,
          p_action_id: actionId,
          p_reason: reason ?? '',
          p_ip: getRequestIp(request),
        });
        if (error) throw error;
      }
      succeeded.push(actionId);
    } catch (error) {
      const message =
        error instanceof TrustedGameDataMutationError
          ? error.code
          : error instanceof Error
            ? error.message
            : 'Unknown moderation failure';
      failures.push({ actionId, message });
    }
  }

  const grouped = new Map<string, TrustedGameDataActionRecord[]>();
  for (const actionId of succeeded) {
    const record = recordsById.get(actionId);
    if (!record?.created_by) continue;
    const group = grouped.get(record.created_by) ?? [];
    group.push(record);
    grouped.set(record.created_by, group);
  }

  for (const [recipientUserId, group] of grouped) {
    const sourceIds = group.map((record) => record.id).sort();
    const entityTypes = Array.from(new Set(group.map((record) => record.entity_type))).join('、');
    const approved = action === 'approve';
    const reasonSuffix = !approved && reason ? `原因：${reason}` : '';
    try {
      await publishNotification({
        recipientUserId,
        kind: approved ? 'game_data_action_approved' : 'game_data_action_rejected',
        decisionOrigin: 'manual',
        title: approved ? '游戏数据改动批量审核通过' : '游戏数据改动批量审核未通过',
        body: `您提交的 ${group.length} 条${entityTypes}改动${approved ? '已通过审核' : '未通过审核'}。${reasonSuffix}`,
        sourceIds,
        dedupeKey: `game-data-actions:batch:${action}:${sourceIds.join(',')}`,
      });
    } catch (notificationError) {
      console.error('Failed to publish batch game data notification:', notificationError);
    }
  }

  return NextResponse.json({ succeeded, failures });
}
