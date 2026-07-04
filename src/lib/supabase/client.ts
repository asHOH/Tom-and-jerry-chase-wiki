import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/data/database.types';

import { hasSupabasePublicConfig, supabasePublishableKey, supabaseUrl } from './config';

function createClient() {
  return !hasSupabasePublicConfig()
    ? (void 0 as never)
    : createBrowserClient<Database>(supabaseUrl!, supabasePublishableKey!);
}

export const supabase = createClient();
