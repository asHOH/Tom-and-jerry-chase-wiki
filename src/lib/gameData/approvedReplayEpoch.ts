import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

type ReplayEpochClient = Pick<SupabaseClient<Database>, 'rpc'>;

export async function readApprovedReplayEpoch(client: ReplayEpochClient): Promise<number> {
  const { data, error } = await client.rpc('read_game_data_approved_replay_epoch');
  if (error) throw new Error('approved_replay_epoch_read_failed', { cause: error });
  if (!Number.isSafeInteger(data) || data < 0) {
    throw new Error('approved_replay_epoch_invalid');
  }
  return data;
}
