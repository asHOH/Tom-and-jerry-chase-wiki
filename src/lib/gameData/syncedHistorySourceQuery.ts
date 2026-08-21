import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import { parseSyncedHistorySourcePayload, type SyncedHistorySourcePayload } from './syncedHistory';

export async function querySyncedHistorySource(
  client: SupabaseClient<Database>
): Promise<SyncedHistorySourcePayload> {
  const { data, error } = await client.rpc('read_game_data_synced_history_source');
  if (error) throw new Error('synced_history_source_query_failed', { cause: error });
  return parseSyncedHistorySourcePayload(data);
}
