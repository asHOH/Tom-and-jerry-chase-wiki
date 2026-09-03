import { NextResponse } from 'next/server';

import { requirePermissionOrAnonymous } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getRequestIp } from '@/lib/blocks/server';
import { candidateConflictResponse } from '@/lib/gameData/candidateConflictResponse';
import { getGameDataNotificationDetails } from '@/lib/gameData/contributionDisplay';
import { checkPendingActionAcknowledgement } from '@/lib/gameData/pendingActionAwarenessServer';
import { PUBLISH_LIMITS } from '@/lib/gameData/publishLimits';
import {
  InvalidPublishOperationIdError,
  readPublishOperationId,
} from '@/lib/gameData/publishOperation';
import {
  preparePublishActionItems,
  PublishPreparationError,
  readBoundedJsonBody,
  type UntrustedPublishActionItem,
} from '@/lib/gameData/publishPreparation';
import { publishPreparationErrorResponse } from '@/lib/gameData/publishPreparationResponse';
import { isGameDataSubmitMode, type GameDataSubmitMode } from '@/lib/gameData/submitMode';
import {
  publishPreparedGameDataActions,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import {
  notifyPendingGameDataActionSubscribers,
  publishNotification,
} from '@/lib/notificationUtils';
import { hasSupabaseAdminConfig } from '@/lib/supabase/admin';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import type { Json } from '@/data/database.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readSubmitMode(value: unknown): GameDataSubmitMode | undefined {
  if (value === undefined) return undefined;
  if (!isGameDataSubmitMode(value)) throw new PublishPreparationError('invalid_shape');
  return value;
}

function readPendingAcknowledgementToken(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^v1:[a-f0-9]{64}$/.test(value)) {
    throw new PublishPreparationError('invalid_shape');
  }
  return value;
}

function readActionItems(body: unknown): {
  items: UntrustedPublishActionItem[];
  message?: unknown;
  pendingAcknowledgementToken?: string;
  submitMode?: GameDataSubmitMode;
} {
  if (!isRecord(body)) throw new PublishPreparationError('invalid_shape');
  const rawItems = Array.isArray(body.actions)
    ? body.actions
    : [{ entityType: body.entityType, entries: body.entries }];
  if (rawItems.length === 0) throw new PublishPreparationError('invalid_shape');
  const submitMode = readSubmitMode(body.submitMode);
  const pendingAcknowledgementToken = readPendingAcknowledgementToken(
    body.pendingAcknowledgementToken
  );

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
  return {
    items,
    ...('message' in body ? { message: body.message } : {}),
    ...(pendingAcknowledgementToken === undefined ? {} : { pendingAcknowledgementToken }),
    ...(submitMode === undefined ? {} : { submitMode }),
  };
}

export async function POST(request: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: 'Supabase is disabled' }, { status: 501 });
  }

  let operationId: string | undefined;
  try {
    operationId = readPublishOperationId(request);
  } catch (error) {
    if (error instanceof InvalidPublishOperationIdError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
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

    if (hasSupabaseAdminConfig()) {
      try {
        const pendingOverlap = await checkPendingActionAcknowledgement({
          prepared,
          userId: guard.userId,
          ...(untrusted.pendingAcknowledgementToken === undefined
            ? {}
            : { providedToken: untrusted.pendingAcknowledgementToken }),
          ...(operationId === undefined ? {} : { operationId }),
        });
        if (pendingOverlap) {
          return NextResponse.json(pendingOverlap, { status: 409 });
        }
      } catch (pendingError) {
        console.warn('Pending game data action overlap check failed open:', pendingError);
      }
    }

    const results = await publishPreparedGameDataActions({
      actorId: guard.userId,
      clientIp: getRequestIp(request),
      permission: 'game_data_action.create',
      grants: guard.grants,
      prepared,
      ...(operationId === undefined ? {} : { operationId }),
      ...(untrusted.submitMode === undefined ? {} : { submitMode: untrusted.submitMode }),
    });

    const notificationRecordsById = new Map<string, { entity_type: string; entry: unknown }>();
    let resultIndex = 0;
    for (const preparedAction of prepared.actions) {
      for (const row of preparedAction.rows) {
        const result = results[resultIndex];
        resultIndex += 1;
        if (result) {
          notificationRecordsById.set(result.id, {
            entity_type: preparedAction.entityType,
            entry: row.canonicalEntry,
          });
        }
      }
    }

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
        const details = getGameDataNotificationDetails(
          matching.flatMap((result) => {
            const record = notificationRecordsById.get(result.id);
            return record ? [record] : [];
          })
        );
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
              ? `您提交的 ${matching.length} 条${details.summary}改动已自动公开，后续仍可由有权限的用户复核或撤销。`
              : `您提交的 ${matching.length} 条${details.summary}改动已自动通过审核。`
            : `您提交的 ${matching.length} 条${details.summary}改动未通过自动审核。`,
          href: details.href ?? '/admin/?tab=actions',
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
      if (error.code === 'idempotency_key_reused') {
        return NextResponse.json({ error: error.code }, { status: 409 });
      }
    }
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
