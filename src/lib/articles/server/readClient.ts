import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { getOptionalSupabaseAdminClient } from '@/lib/supabase/adminClient';
import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';
import type { Database } from '@/data/database.types';

export function getPublicReadClient(): SupabaseClient<Database> | undefined {
  // Prefer secret-key admin access for consistency, fall back to the publishable-key client.
  return getOptionalSupabaseAdminClient() ?? getOptionalSupabasePublicClient();
}

export function getAdminClient(): SupabaseClient<Database> | undefined {
  return getOptionalSupabaseAdminClient();
}
