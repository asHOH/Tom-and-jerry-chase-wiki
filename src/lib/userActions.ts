'use server';

import { createClient } from './supabase/server';

export async function getUserData() {
  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES) {
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
