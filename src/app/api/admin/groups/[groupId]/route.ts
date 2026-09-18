import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  permissionGrantResourceExists,
  permissionGrantSchema,
} from '@/lib/auth/permissionGrantValidation';
import { requirePermission } from '@/lib/auth/requirePermission';
import { CACHE_TAGS, invalidateCache } from '@/lib/cacheTags';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().max(200),
  isDefault: z.boolean(),
  parentGroupId: z.string().uuid().nullable().optional(),
  grants: z.array(permissionGrantSchema),
});

const grantsSchema = z.object({
  grants: z.array(permissionGrantSchema),
});

const getGroupId = async (params: Promise<{ groupId: string }>) => (await params).groupId;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const guard = await requirePermission('group.manage', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!(await Promise.all(parsed.data.grants.map(permissionGrantResourceExists))).every(Boolean)) {
    return NextResponse.json({ error: 'Unknown resource ID' }, { status: 400 });
  }
  const rpcArguments = {
    p_group_id: await getGroupId(params),
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_is_default: parsed.data.isDefault,
    p_grants: parsed.data.grants,
  };
  const { error } =
    parsed.data.parentGroupId === undefined
      ? await guard.supabase.rpc('save_permission_group', rpcArguments)
      : await guard.supabase.rpc('save_permission_group_v2', {
          ...rpcArguments,
          p_parent_group_id: parsed.data.parentGroupId,
        });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await invalidateCache(CACHE_TAGS.users);
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const guard = await requirePermission('group.manage', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;
  const parsed = grantsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!(await Promise.all(parsed.data.grants.map(permissionGrantResourceExists))).every(Boolean)) {
    return NextResponse.json({ error: 'Unknown resource ID' }, { status: 400 });
  }
  const { error } = await guard.supabase.rpc('set_group_grants', {
    p_group_id: await getGroupId(params),
    p_grants: parsed.data.grants,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await invalidateCache(CACHE_TAGS.users);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const guard = await requirePermission('group.manage', undefined, 'all', {
    request,
    blockAction: 'edit',
  });
  if ('error' in guard) return guard.error;
  const { error } = await guard.supabase.rpc('delete_permission_group', {
    p_group_id: await getGroupId(params),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  await invalidateCache(CACHE_TAGS.users);
  return NextResponse.json({ ok: true });
}
