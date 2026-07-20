import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isKnownStaticPermissionResource } from '@/lib/auth/permissionResources';
import { isPermissionKey } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/requirePermission';
import {
  isPermissionResourceTypeAllowed,
  isScopableResourceType,
} from '@/lib/auth/resourceContexts';
import { supabaseAdmin } from '@/lib/supabase/admin';

const updateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().max(200),
  isDefault: z.boolean(),
  parentGroupId: z.string().uuid().nullable().optional(),
  grants: z.array(
    z.object({
      permission: z.string(),
      scope: z.enum(['global', 'resource_type', 'resource']),
      resourceType: z.string().trim().min(1).max(100).nullable(),
      resourceId: z.string().trim().min(1).max(200).nullable(),
    })
  ),
});

const grantsSchema = z.object({
  grants: z.array(
    z.object({
      permission: z.string(),
      scope: z.enum(['global', 'resource_type', 'resource']),
      resourceType: z.string().trim().min(1).max(100).nullable(),
      resourceId: z.string().trim().min(1).max(200).nullable(),
    })
  ),
});

type GrantInput = z.infer<typeof grantsSchema>['grants'][number];

const isValidGrant = (grant: GrantInput) => {
  if (!isPermissionKey(grant.permission)) return false;
  if (grant.scope === 'global') return true;
  if (!grant.resourceType || !isScopableResourceType(grant.resourceType)) return false;
  if (!isPermissionResourceTypeAllowed(grant.permission, grant.resourceType)) return false;
  return grant.scope !== 'resource' || Boolean(grant.resourceId);
};

const resourceExists = async (grant: GrantInput) => {
  if (grant.scope !== 'resource' || !grant.resourceType || !grant.resourceId) return true;
  const staticResult = isKnownStaticPermissionResource(grant.resourceType, grant.resourceId);
  if (staticResult !== null) return staticResult;
  const table = grant.resourceType === 'comments/articles' ? 'articles' : grant.resourceType;
  if (table !== 'articles' && table !== 'categories') return false;
  const { data } = await supabaseAdmin
    .from(table)
    .select('id')
    .eq('id', grant.resourceId)
    .maybeSingle();
  return Boolean(data);
};

const getGroupId = async (params: Promise<{ groupId: string }>) => (await params).groupId;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const guard = await requirePermission('group.manage');
  if ('error' in guard) return guard.error;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.grants.some((grant) => !isValidGrant(grant))) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!(await Promise.all(parsed.data.grants.map(resourceExists))).every(Boolean)) {
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
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const guard = await requirePermission('group.manage');
  if ('error' in guard) return guard.error;
  const parsed = grantsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.grants.some((grant) => !isValidGrant(grant))) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!(await Promise.all(parsed.data.grants.map(resourceExists))).every(Boolean)) {
    return NextResponse.json({ error: 'Unknown resource ID' }, { status: 400 });
  }
  const { error } = await guard.supabase.rpc('set_group_grants', {
    p_group_id: await getGroupId(params),
    p_grants: parsed.data.grants,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const guard = await requirePermission('group.manage');
  if ('error' in guard) return guard.error;
  const { error } = await guard.supabase.rpc('delete_permission_group', {
    p_group_id: await getGroupId(params),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 409 });
  return NextResponse.json({ ok: true });
}
