import { NextResponse } from 'next/server';
import z from 'zod';

import { requireRole } from '@/lib/auth/requireRole';
import { isCharacterRelationAction } from '@/lib/edit/characterRelationActions';
import type { ActionHistoryEntry } from '@/lib/edit/diffUtils';
import { flattenActionEntries } from '@/lib/gameData/actionEntries';
import {
  publishGameDataActions,
  PublishGameDataActionsError,
} from '@/lib/gameData/publishGameDataActions';
import { actionHistorySchema } from '@/lib/validation/schemas';
import type { Json } from '@/data/database.types';
import { env } from '@/env';

const schema = z.object({
  entries: actionHistorySchema,
  message: z.string().optional(),
});

export async function POST(req: Request) {
  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase is disabled' }, { status: 501 });
  }

  try {
    const guard = await requireRole(['Contributor', 'Reviewer', 'Coordinator']);
    if ('error' in guard) return guard.error;

    let body: { entries: ActionHistoryEntry[]; message?: string };
    try {
      const parsed = schema.parse(await req.json());
      body = {
        entries: parsed.entries as ActionHistoryEntry[],
        ...(typeof parsed.message === 'string' ? { message: parsed.message } : {}),
      };
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const flattenedEntries = flattenActionEntries(body.entries);
    if (flattenedEntries.length === 0) {
      return NextResponse.json({ error: 'No actions to publish' }, { status: 400 });
    }

    if (!flattenedEntries.every(isCharacterRelationAction)) {
      return NextResponse.json({ error: 'Only relation actions are allowed' }, { status: 400 });
    }

    const message = typeof body.message === 'string' ? body.message.trim() : undefined;
    const result = await publishGameDataActions(
      guard.supabase,
      [{ entityType: 'characters', entries: body.entries as unknown as Json[] }],
      message
    );

    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof PublishGameDataActionsError) {
      console.error(`Error publishing game data actions for ${err.entityType}:`, err.cause);
      return NextResponse.json(
        { error: `Failed to publish actions for ${err.entityType}` },
        { status: 500 }
      );
    }

    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
