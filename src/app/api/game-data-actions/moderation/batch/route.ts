import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { canAccessAll } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG } from '@/lib/gameData/publicActions';
import { publishNotification } from '@/lib/notificationUtils';

const schema = z.object({
  actionIds: z.array(z.uuid()).min(1).max(200),
  action: z.enum(['approve', 'reject']),
  reason: z.string().trim().max(1000).optional(),
});

type ModerationRecord = {
  created_by: string | null;
  entity_type: string;
  entry: import('@/data/database.types').Json;
  id: string;
};

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });

  const guard = await requirePermission(
    parsed.data.action === 'approve' ? 'game_data_action.approve' : 'game_data_action.reject'
  );
  if ('error' in guard) return guard.error;
  const { supabase } = guard;
  const { actionIds, action, reason } = parsed.data;

  const { data: records, error: recordsError } = await supabase
    .from('game_data_actions')
    .select('id, created_by, entity_type, entry')
    .in('id', actionIds)
    .eq('status', 'pending');

  if (recordsError) {
    return NextResponse.json({ error: 'Failed to load actions' }, { status: 500 });
  }

  const requiredPermission =
    action === 'approve' ? 'game_data_action.approve' : 'game_data_action.reject';
  const contexts = (records ?? []).flatMap((record) =>
    getGameActionResourceContexts(record.entity_type, [record.entry])
  );
  if (!canAccessAll(guard.grants, requiredPermission, contexts)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const recordsById = new Map(
    (records ?? []).map((record) => [record.id, record satisfies ModerationRecord])
  );
  const succeeded: string[] = [];
  const failures: Array<{ actionId: string; message: string }> = [];

  for (const actionId of actionIds) {
    const record = recordsById.get(actionId);
    if (!record) {
      failures.push({ actionId, message: 'Action not found or not pending' });
      continue;
    }

    const { error } =
      action === 'approve'
        ? await supabase.rpc('approve_game_data_action', { p_action_id: actionId })
        : await supabase.rpc('reject_game_data_action', {
            p_action_id: actionId,
            ...(reason ? { p_reason: reason } : {}),
          });

    if (error) failures.push({ actionId, message: error.message });
    else succeeded.push(actionId);
  }

  if (action === 'approve' && succeeded.length > 0) {
    revalidateTag(PUBLIC_GAME_DATA_ACTIONS_CACHE_TAG, 'max');
  }

  const grouped = new Map<string, ModerationRecord[]>();
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
