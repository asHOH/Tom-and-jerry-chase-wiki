import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import { supabaseAdmin } from './admin';
import { SupabaseConfigurationError } from './config';

export function getOptionalSupabaseAdminClient(): SupabaseClient<Database> | undefined {
  return supabaseAdmin;
}

export function requireSupabaseAdminClient(): SupabaseClient<Database> {
  if (!supabaseAdmin) throw new SupabaseConfigurationError('admin');
  return supabaseAdmin;
}
