import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requirePermission } from '@/lib/auth/requirePermission';
import { BLOCK_ACTIONS } from '@/lib/blocks/types';

const restrictionSchema = z
  .object({
    action: z.enum(BLOCK_ACTIONS),
    resourceType: z.string().trim().min(1).max(100).nullable(),
    resourceId: z.string().trim().min(1).max(200).nullable(),
  })
  .refine((value) => (value.resourceType === null) === (value.resourceId === null));

const modifySchema = z.object({
  reason: z.string().trim().min(1).max(1000),
  expiresAt: z.string().datetime({ offset: true }).nullable(),
  hardBlock: z.boolean(),
  restrictions: z.array(restrictionSchema).min(1).max(100),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const guard = await requirePermission('block.manage');
  if ('error' in guard) return guard.error;
  const blockId = (await params).blockId;
  const parsed = modifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  const { error } = await guard.supabase.rpc('modify_block', {
    p_block_id: blockId,
    p_reason: parsed.data.reason,
    p_expires_at: parsed.data.expiresAt,
    p_hard_block: parsed.data.hardBlock,
    p_restrictions: parsed.data.restrictions,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const guard = await requirePermission('block.manage');
  if ('error' in guard) return guard.error;
  const body = (await request.json().catch(() => null)) as { reason?: unknown } | null;
  if (typeof body?.reason !== 'string' || !body.reason.trim()) {
    return NextResponse.json({ error: 'Unblock reason is required' }, { status: 400 });
  }
  const { error } = await guard.supabase.rpc('unblock', {
    p_block_id: (await params).blockId,
    p_reason: body.reason.trim(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
