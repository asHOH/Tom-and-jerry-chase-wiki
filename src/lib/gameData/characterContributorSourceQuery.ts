import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import {
  parseCharacterContributorSourcePayload,
  type CharacterContributorSourcePayload,
} from './characterContributors';

export async function queryCharacterContributorSource(
  client: SupabaseClient<Database>
): Promise<CharacterContributorSourcePayload> {
  const { data, error } = await client.rpc('read_game_data_character_contributor_source');
  if (error) throw new Error('character_contributor_source_query_failed', { cause: error });
  return parseCharacterContributorSourcePayload(data);
}
