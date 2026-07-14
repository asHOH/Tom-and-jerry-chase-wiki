import { NextResponse } from 'next/server';
import z from 'zod';

import {
  publishGameDataActions,
  PublishGameDataActionsError,
} from '@/lib/gameData/publishGameDataActions';
import { publishNotification } from '@/lib/notificationUtils';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/data/database.types';

type ActionItem = {
  entityType: string;
  entries: Json[];
};

const schema = z.union([
  z.object({
    entityType: z.string(),
    entries: z.array(z.any()),
    message: z.string().optional(),
  }),
  z.object({
    actions: z.array(
      z.object({
        entityType: z.string(),
        entries: z.array(z.any()),
      })
    ),
    message: z.string().optional(),
  }),
]);

export async function POST(req: Request) {
  if (!hasSupabasePublicConfig()) {
    return NextResponse.json({ error: 'Supabase is disabled' }, { status: 501 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : undefined;

  // Build list of actions to publish
  const actionList: ActionItem[] = [];

  // Support new batch format: actions array (merge same entityType)
  if ('actions' in body) {
    const grouped = new Map<string, Json[]>();

    for (const action of body.actions) {
      const entityType = typeof action.entityType === 'string' ? action.entityType.trim() : '';
      if (!entityType) {
        return NextResponse.json({ error: 'Missing entityType in actions array' }, { status: 400 });
      }
      if (!Array.isArray(action.entries)) {
        return NextResponse.json(
          { error: `entries must be an array for entityType: ${entityType}` },
          { status: 400 }
        );
      }

      const existing = grouped.get(entityType);
      if (existing) {
        existing.push(...action.entries);
      } else {
        grouped.set(entityType, [...action.entries]);
      }
    }

    grouped.forEach((entries, entityType) => {
      actionList.push({ entityType, entries });
    });
  }
  // Legacy single-action format
  else if (body.entityType || body.entries) {
    const entityType = typeof body.entityType === 'string' ? body.entityType.trim() : '';
    if (!entityType) {
      return NextResponse.json({ error: 'Missing entityType' }, { status: 400 });
    }
    if (!Array.isArray(body.entries)) {
      return NextResponse.json({ error: 'entries must be an array' }, { status: 400 });
    }
    actionList.push({ entityType, entries: body.entries });
  }

  if (actionList.length === 0) {
    return NextResponse.json({ error: 'No actions to publish' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();
    const userId = claimsData?.claims.sub;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const allResults = await publishGameDataActions(supabase, actionList, message);

    const finalResults = allResults.filter(
      (result) => result.status === 'approved' || result.status === 'rejected'
    );
    for (const status of ['approved', 'rejected'] as const) {
      const matching = finalResults.filter((result) => result.status === status);
      if (matching.length === 0) continue;
      const approved = status === 'approved';
      try {
        await publishNotification({
          recipientUserId: userId,
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

    return NextResponse.json({ result: allResults });
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
