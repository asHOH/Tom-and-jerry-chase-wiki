import { NextResponse } from 'next/server';
import type { Database } from '@/data/database.types';

import { createClient } from '@/lib/supabase/server';

export type Role = Database['public']['Enums']['role_type'];

export async function requireRole(allowed: Role[] = ['Coordinator']) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) } as const;
  }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', user.id).single();
  const role = roleData?.role as Role | undefined;
  if (!role || !allowed.includes(role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } as const;
  }

  return { supabase } as const;
}
