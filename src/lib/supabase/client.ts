import type { Database } from '@/data/database.types';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? (void 0 as never)
    : createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
}

export const supabase = createClient();
