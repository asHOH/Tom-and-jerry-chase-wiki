'use server';

import { env } from '@/env';

import { createClient } from './supabase/server';

export async function getUserData() {
  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      role: null,
      nickname: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      role: null,
      nickname: null,
    };
  }

  const { data } = await supabase.from('users').select('role, nickname').eq('id', user.id).single();
  return {
    role: data?.role || null,
    nickname: data?.nickname || null,
  };
}
