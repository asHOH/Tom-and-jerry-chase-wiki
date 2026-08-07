import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';

import { getOptionalSupabasePublicConfig } from './config';

const config = getOptionalSupabasePublicConfig();
export const supabase: SupabaseClient<Database> | undefined = config
  ? createBrowserClient<Database>(config.url, config.publishableKey)
  : undefined;
