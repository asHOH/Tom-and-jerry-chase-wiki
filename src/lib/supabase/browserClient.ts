'use client';

import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import { supabase } from './client';
import { SupabaseConfigurationError } from './config';

export function getOptionalSupabaseBrowserClient(): SupabaseClient<Database> | undefined {
  return supabase;
}

export function requireSupabaseBrowserClient(): SupabaseClient<Database> {
  if (!supabase) throw new SupabaseConfigurationError('browser');
  return supabase;
}
