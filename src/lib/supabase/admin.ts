import { createClient } from '@supabase/supabase-js';
import { Database } from '@/data/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Note: this client is a singleton and can be used across the server-side of the app.
// It has elevated privileges and should be used with caution.
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);
