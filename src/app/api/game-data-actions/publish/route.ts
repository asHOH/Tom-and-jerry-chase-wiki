import { NextResponse } from 'next/server';

import { requirePermissionOrAnonymous } from '@/lib/auth/requirePermission';
import { candidateConflictResponse } from '@/lib/gameData/candidateConflictResponse';
import { PUBLISH_LIMITS } from '@/lib/gameData/publishLimits';
import {
  preparePublishActionItems,
  PublishPreparationError,
  readBoundedJsonBody,
  type UntrustedPublishActionItem,
} from '@/lib/gameData/publishPreparation';
import { publishPreparationErrorResponse } from '@/lib/gameData/publishPreparationResponse';
import {
  publishPreparedGameDataActions,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { publishNotification } from '@/lib/notificationUtils';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readActionItems(body: unknown): {
  items: UntrustedPublishActionItem[];
  message?: unknown;
} {
  if (!isRecord(body)) throw new PublishPreparationError('invalid_shape');
  const rawItems = Array.isArray(body.actions)
    ? body.actions
    : [{ entityType: body.entityType, entries: body.entries }];
  if (rawItems.length === 0) throw new PublishPreparationError('invalid_shape');

  let entryCount = 0;
  const items = rawItems.map((item) => {
    if (!isRecord(item) || !Array.isArray(item.entries)) {
      throw new PublishPreparationError('invalid_shape');
    }
    entryCount += item.entries.length;
    if (entryCount > PUBLISH_LIMITS.topLevelEntries) {
      throw new PublishPreparationError('too_many_entries');
    }
    return { entityType: item.entityType, entries: item.entries };
  });
  return { items, ...('message' in body ? { message: body.message } : {}) };
}

export async function POST(request: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: 'Supabase is disabled' }, { status: 501 });
  }

  let untrusted: ReturnType<typeof readActionItems>;
  try {
    untrusted = readActionItems(await readBoundedJsonBody(request));
  } catch (error) {
    return error instanceof PublishPreparationError
      ? publishPreparationErrorResponse(error, '/api/game-data-actions/publish')
      : NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const guard = await requirePermissionOrAnonymous('game_data_action.create');
  if ('error' in guard) return guard.error;

  try {
    const prepared = preparePublishActionItems(untrusted.items, untrusted.message);
    const results = await publishPreparedGameDataActions({
      actorId: guard.userId,
      permission: 'game_data_action.create',
      grants: guard.grants,
      prepared,
    });

    const finalResults = results.filter(
      (result) => result.status === 'approved' || result.status === 'rejected'
    );
    const recipientUserId = guard.userId;
    for (const status of ['approved', 'rejected'] as const) {
      const matching = finalResults.filter((result) => result.status === status);
      if (matching.length === 0 || recipientUserId === null) continue;
      const approved = status === 'approved';
      try {
        await publishNotification({
          recipientUserId,
          kind: approved ? 'game_data_action_approved' : 'game_data_action_rejected',
          decisionOrigin: 'automatic',
          title: approved ? '游戏数据改动已自动通过' : '游戏数据改动未通过',
          body: approved
            ? `您提交的 ${matching.length} 条游戏数据改动已自动通过审核。`
            : `您提交的 ${matching.length} 条游戏数据改动未通过自动审核。`,
          sourceIds: matching.map((result) => result.id),
          dedupeKey: `game-data-actions:auto:${status}:${matching
            .map((result) => result.id)
            .sort()
            .join(',')}`,
        });
      } catch (notificationError) {
        console.error('Failed to publish automatic game data notification:', notificationError);
      }
    }

    return NextResponse.json({ result: results });
  } catch (error) {
    if (error instanceof PublishPreparationError) {
      return publishPreparationErrorResponse(error, '/api/game-data-actions/publish');
    }
    if (error instanceof TrustedGameDataMutationError) {
      if (error.code === 'forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (error.code === 'candidate_conflict') {
        return candidateConflictResponse(error, '/api/game-data-actions/publish');
      }
      if (error.code === 'replay_epoch_conflict') {
        return NextResponse.json({ error: error.code }, { status: 409 });
      }
    }
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
