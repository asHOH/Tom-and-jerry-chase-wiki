import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { getGameActionResourceContexts } from '@/lib/auth/resourceContexts';
import { getRequestIp } from '@/lib/blocks/server';
import { isCharacterRelationAction } from '@/lib/edit/characterRelationActions';
import { candidateConflictResponse } from '@/lib/gameData/candidateConflictResponse';
import {
  preparePublishActionItems,
  PublishPreparationError,
  readBoundedJsonBody,
} from '@/lib/gameData/publishPreparation';
import { publishPreparationErrorResponse } from '@/lib/gameData/publishPreparationResponse';
import { isGameDataSubmitMode, type GameDataSubmitMode } from '@/lib/gameData/submitMode';
import {
  publishPreparedGameDataActions,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
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

export async function POST(request: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: 'Supabase is disabled' }, { status: 501 });
  }

  let body: Record<string, unknown> & { submitMode?: GameDataSubmitMode };
  try {
    const value = await readBoundedJsonBody(request);
    if (!isRecord(value) || !Array.isArray(value.entries)) {
      throw new PublishPreparationError('invalid_shape');
    }
    const submitMode = readSubmitMode(value.submitMode);
    body = {
      ...value,
      ...(submitMode === undefined ? {} : { submitMode }),
    };
  } catch (error) {
    return error instanceof PublishPreparationError
      ? publishPreparationErrorResponse(error, '/api/game-data-actions/publish-relations')
      : NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const guard = await requirePermission('game_data_action.publish_relations', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;

  try {
    const prepared = preparePublishActionItems(
      [{ entityType: 'characters', entries: body.entries }],
      body.message
    );
    if (
      !prepared.actions.every((item) =>
        item.rows.every((row) => row.actions.every(isCharacterRelationAction))
      )
    ) {
      return NextResponse.json({ error: 'Only relation actions are allowed' }, { status: 400 });
    }

    const resourceGuard = await requirePermission(
      'game_data_action.publish_relations',
      getGameActionResourceContexts(
        'characters',
        prepared.actions.flatMap((item) => item.rows.map((row) => row.canonicalEntry as Json))
      ),
      'all',
      { request, blockAction: 'edit' }
    );
    if ('error' in resourceGuard) return resourceGuard.error;

    const result = await publishPreparedGameDataActions({
      actorId: guard.userId,
      clientIp: getRequestIp(request),
      permission: 'game_data_action.publish_relations',
      grants: guard.grants,
      prepared,
      ...(body.submitMode === undefined ? {} : { submitMode: body.submitMode }),
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof PublishPreparationError) {
      return publishPreparationErrorResponse(error, '/api/game-data-actions/publish-relations');
    }
    if (error instanceof TrustedGameDataMutationError) {
      if (error.code === 'forbidden') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (error.code === 'candidate_conflict') {
        return candidateConflictResponse(error, '/api/game-data-actions/publish-relations');
      }
      if (error.code === 'replay_epoch_conflict') {
        return NextResponse.json({ error: error.code }, { status: 409 });
      }
    }
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
