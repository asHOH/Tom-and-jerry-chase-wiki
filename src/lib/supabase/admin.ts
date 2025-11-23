import { Database } from '@/data/database.types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Note: this client is a singleton and can be used across the server-side of the app.
// It has elevated privileges and should be used with caution.
export const supabaseAdmin = process.env.NEXT_PUBLIC_DISABLE_ARTICLES
  ? (void 0 as never)
  : createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!);
