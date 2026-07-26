import { NextResponse } from 'next/server';

import { requirePermissionOrAnonymous } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getRequestIp } from '@/lib/blocks/server';
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
import {
  notifyPendingGameDataActionSubscribers,
  publishNotification,
} from '@/lib/notificationUtils';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import type { Json } from '@/data/database.types';

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

  const guard = await requirePermissionOrAnonymous('game_data_action.create', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;

  try {
    const prepared = preparePublishActionItems(untrusted.items, untrusted.message);
    const contexts = prepared.actions.flatMap((item) =>
      getGameActionResourceContexts(
        item.entityType,
        item.rows.map((row) => row.canonicalEntry as Json)
      )
    );
    const resourceGuard = await requirePermissionOrAnonymous(
      'game_data_action.create',
      contexts,
      'all',
      { request, blockAction: 'edit' }
    );
    if ('error' in resourceGuard) return resourceGuard.error;
    const results = await publishPreparedGameDataActions({
      actorId: guard.userId,
      clientIp: getRequestIp(request),
      permission: 'game_data_action.create',
      grants: guard.grants,
      prepared,
    });

    const pendingActionIds = results
      .filter((result) => result.status === 'pending' && !result.is_public)
      .map((result) => result.id);
    if (pendingActionIds.length > 0) {
      try {
        await notifyPendingGameDataActionSubscribers({
          actorUserId: guard.userId,
          actionIds: pendingActionIds,
        });
      } catch (notificationError) {
        console.error(
          'Failed to publish pending game data action notifications:',
          notificationError
        );
      }
    }

    const recipientUserId = guard.userId;
    for (const outcome of ['public', 'rejected'] as const) {
      const matching = results.filter((result) =>
        outcome === 'public' ? result.is_public : result.status === 'rejected'
      );
      if (matching.length === 0 || recipientUserId === null) continue;
      const approved = outcome === 'public';
      const pendingPublic = approved && matching.some((result) => result.status === 'pending');
      try {
        await publishNotification({
          recipientUserId,
          kind: approved ? 'game_data_action_approved' : 'game_data_action_rejected',
          decisionOrigin: 'automatic',
          title: approved
            ? pendingPublic
              ? '游戏数据改动已自动公开'
              : '游戏数据改动已自动通过'
            : '游戏数据改动未通过',
          body: approved
            ? pendingPublic
              ? `您提交的 ${matching.length} 条游戏数据改动已自动公开，后续仍可由有权限的用户复核或撤销。`
              : `您提交的 ${matching.length} 条游戏数据改动已自动通过审核。`
            : `您提交的 ${matching.length} 条游戏数据改动未通过自动审核。`,
          sourceIds: matching.map((result) => result.id),
          dedupeKey: `game-data-actions:auto:${outcome}:${matching
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
