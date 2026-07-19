import { NextResponse } from 'next/server';

import { requirePermission } from '@/lib/auth/requirePermission';
import { isCharacterRelationAction } from '@/lib/edit/characterRelationActions';
import {
  preparePublishActionItems,
  PublishPreparationError,
  readBoundedJsonBody,
} from '@/lib/gameData/publishPreparation';
import { publishPreparationErrorResponse } from '@/lib/gameData/publishPreparationResponse';
import {
  publishPreparedGameDataActions,
  TrustedGameDataMutationError,
} from '@/lib/gameData/trustedGameDataMutations';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function POST(request: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: 'Supabase is disabled' }, { status: 501 });
  }

  let body: Record<string, unknown>;
  try {
    const value = await readBoundedJsonBody(request);
    if (!isRecord(value) || !Array.isArray(value.entries)) {
      throw new PublishPreparationError('invalid_shape');
    }
    body = value;
  } catch (error) {
    return error instanceof PublishPreparationError
      ? publishPreparationErrorResponse(error, '/api/game-data-actions/publish-relations')
      : NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const guard = await requirePermission('game_data_action.publish_relations');
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

    const result = await publishPreparedGameDataActions({
      actorId: guard.userId,
      permission: 'game_data_action.publish_relations',
      grants: guard.grants,
      prepared,
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
      if (error.code === 'candidate_conflict' || error.code === 'replay_epoch_conflict') {
        return NextResponse.json({ error: error.code }, { status: 409 });
      }
    }
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
