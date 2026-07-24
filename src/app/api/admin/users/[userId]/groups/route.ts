import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requirePermission } from '@/lib/auth/requirePermission';

const schema = z.object({ groupIds: z.array(z.uuid()).max(100) });

export async function PUT(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const guard = await requirePermission('group.assign', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  const { userId } = await params;
  const { error } = await guard.supabase.rpc('set_user_groups', {
    p_user_id: userId,
    p_group_ids: parsed.data.groupIds,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
