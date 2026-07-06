import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServerPublic } from '@/lib/supabase/public';
import type { Database } from '@/data/database.types';

export function getPublicReadClient(): SupabaseClient<Database> | undefined {
  // Prefer secret-key admin access for consistency, fall back to the publishable-key client.
  return (
    (supabaseAdmin as unknown as SupabaseClient<Database> | undefined) ??
    (supabaseServerPublic as unknown as SupabaseClient<Database> | undefined)
  );
}

export function getAdminClient(): SupabaseClient<Database> | undefined {
  return supabaseAdmin as unknown as SupabaseClient<Database> | undefined;
}
