import { NextResponse } from 'next/server';
import z from 'zod';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/data/database.types';
import { env } from '@/env';

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
  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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

  // Support new batch format: actions array
  if ('actions' in body) {
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
      actionList.push({ entityType, entries: action.entries });
    }
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
    const allResults: Array<{ id: string; is_public: boolean; status: string }> = [];

    for (const action of actionList) {
      const { data, error } = await supabase.rpc('publish_game_data_actions', {
        p_entity_type: action.entityType,
        p_entries: action.entries,
        p_message: message!,
      });

      if (error) {
        console.error(`Error publishing game data actions for ${action.entityType}:`, error);
        return NextResponse.json(
          { error: `Failed to publish actions for ${action.entityType}` },
          { status: 500 }
        );
      }

      if (data) {
        allResults.push(...data);
      }
    }

    return NextResponse.json({ result: allResults });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
