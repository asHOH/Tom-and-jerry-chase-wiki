import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '@/data/database.types';

export type PublishGameDataActionItem = {
  entityType: string;
  entries: Json[];
};

export type PublishGameDataActionResult = {
  id: string;
  is_public: boolean;
  status: Database['public']['Enums']['game_data_action_status'];
};

export class PublishGameDataActionsError extends Error {
  constructor(
    readonly entityType: string,
    readonly cause: unknown
  ) {
    super(`Failed to publish actions for ${entityType}`);
    this.name = 'PublishGameDataActionsError';
  }
}

export const publishGameDataActions = async (
  supabase: SupabaseClient<Database>,
  actions: readonly PublishGameDataActionItem[],
  message?: string
): Promise<PublishGameDataActionResult[]> => {
  const allResults: PublishGameDataActionResult[] = [];

  for (const action of actions) {
    const { data, error } = await supabase.rpc('publish_game_data_actions', {
      p_entity_type: action.entityType,
      p_entries: action.entries,
      ...(message ? { p_message: message } : {}),
    });

    if (error) {
      throw new PublishGameDataActionsError(action.entityType, error);
    }

    if (data) {
      allResults.push(...data);
    }
  }

  return allResults;
};
