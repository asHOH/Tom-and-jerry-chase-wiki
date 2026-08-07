import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import { SupabaseConfigurationError } from './config';
import { supabaseServerPublic } from './public';

export function getOptionalSupabasePublicClient(): SupabaseClient<Database> | undefined {
  return supabaseServerPublic;
}

export function requireSupabasePublicClient(): SupabaseClient<Database> {
  if (!supabaseServerPublic) throw new SupabaseConfigurationError('public');
  return supabaseServerPublic;
}
