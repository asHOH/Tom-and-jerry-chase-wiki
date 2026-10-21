import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import type { PublicActionRow } from './publicActionsTypes';

type PublicActionQueryClient = Pick<SupabaseClient<Database>, 'from'>;

type ApprovedPublicActionSource = {
  rows: PublicActionRow[];
  exactCount: number;
};

const PUBLIC_ACTION_ROW_COLUMNS =
  'id, entity_type, entry, created_at, status, message, reviewed_at, created_by';

export class PublicActionQueryError extends Error {
  constructor(
    message: string,
    public override readonly cause: unknown
  ) {
    super(message);
    this.name = 'PublicActionQueryError';
  }
}

/** Queries the ordered public rows that are eligible for replay. */
export async function queryApprovedPublicActionRows(
  supabase: PublicActionQueryClient
): Promise<PublicActionRow[]> {
  const { data, error } = await supabase
    .from('game_data_actions')
    .select(PUBLIC_ACTION_ROW_COLUMNS)
    .eq('is_public', true)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    throw new PublicActionQueryError('Failed to query public game data actions', error);
  }

  return data ?? [];
}

/**
 * Uses the same eligibility and ordering as the runtime query while requesting
 * an exact count in the same PostgREST call. Build prepasses use this to reject
 * silently truncated responses.
 */
export async function queryApprovedPublicActionSource(
  supabase: PublicActionQueryClient
): Promise<ApprovedPublicActionSource> {
  const { data, error, count } = await supabase
    .from('game_data_actions')
    .select(PUBLIC_ACTION_ROW_COLUMNS, { count: 'exact' })
    .eq('is_public', true)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    throw new PublicActionQueryError('Failed to query public game data actions', error);
  }
  if (!Number.isSafeInteger(count) || count === null || count < 0) {
    throw new PublicActionQueryError('Approved game data action count is unavailable', count);
  }

  return { rows: data ?? [], exactCount: count };
}
