import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import type { PublicActionRow } from './publicActionsTypes';

type PublicActionQueryClient = Pick<SupabaseClient<Database>, 'from'>;

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

async function queryPublicActionRows(
  supabase: PublicActionQueryClient,
  statuses: readonly ['approved'] | readonly ['approved', 'synced']
): Promise<PublicActionRow[]> {
  let query = supabase
    .from('game_data_actions')
    .select(PUBLIC_ACTION_ROW_COLUMNS)
    .eq('is_public', true);

  query =
    statuses.length === 1 ? query.eq('status', statuses[0]) : query.in('status', [...statuses]);

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    throw new PublicActionQueryError('Failed to query public game data actions', error);
  }

  return data ?? [];
}

/** Queries the ordered public rows that are eligible for replay. */
export function queryApprovedPublicActionRows(
  supabase: PublicActionQueryClient
): Promise<PublicActionRow[]> {
  return queryPublicActionRows(supabase, ['approved']);
}

/** Queries the ordered public rows retained in entity-update and audit history. */
export function queryPublicActionHistoryRows(
  supabase: PublicActionQueryClient
): Promise<PublicActionRow[]> {
  return queryPublicActionRows(supabase, ['approved', 'synced']);
}
