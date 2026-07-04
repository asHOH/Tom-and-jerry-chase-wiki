'use server';

import { hasSupabasePublicConfig } from './supabase/config';
import { createClient } from './supabase/server';

export async function getUserData() {
  if (!hasSupabasePublicConfig()) {
    return {
      role: null,
      nickname: null,
    };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    return {
      role: null,
      nickname: null,
    };
  }

  const { data } = await supabase.from('users').select('role, nickname').eq('id', userId).single();
  return {
    role: data?.role || null,
    nickname: data?.nickname || null,
  };
}
