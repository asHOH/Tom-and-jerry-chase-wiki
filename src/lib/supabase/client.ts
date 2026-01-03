import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@/data/database.types';
import { env } from '@/env';

function createClient() {
  return env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? (void 0 as never)
    : createBrowserClient<Database>(
        env.NEXT_PUBLIC_SUPABASE_URL!,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
}

export const supabase = createClient();
