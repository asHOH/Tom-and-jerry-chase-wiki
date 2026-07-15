import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  getAllStaticPermissionResourceOptions,
  isKnownStaticPermissionResource,
} from '@/lib/auth/permissionResources';
import { isPermissionKey, type PermissionGrant } from '@/lib/auth/permissions';
import { requirePermission } from '@/lib/auth/requirePermission';
import {
  isPermissionResourceTypeAllowed,
  isScopableResourceType,
} from '@/lib/auth/resourceContexts';
import { supabaseAdmin } from '@/lib/supabase/admin';

const grantSchema = z.object({
  permission: z.string(),
  scope: z.enum(['global', 'resource_type', 'resource']),
  resourceType: z.string().trim().min(1).max(100).nullable(),
  resourceId: z.string().trim().min(1).max(200).nullable(),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(50),
  description: z.string().max(200).default(''),
  isDefault: z.boolean().default(false),
  grants: z.array(grantSchema).default([]),
});

const toRpcGrants = (grants: z.infer<typeof grantSchema>[]) =>
  grants.map((grant) => ({
    permission: grant.permission,
    scope: grant.scope,
    resourceType: grant.resourceType,
    resourceId: grant.resourceId,
  }));

const isValidGrant = (grant: z.infer<typeof grantSchema>) => {
  if (!isPermissionKey(grant.permission)) return false;
  if (grant.scope === 'global') return true;
  if (!grant.resourceType || !isScopableResourceType(grant.resourceType)) return false;
  if (!isPermissionResourceTypeAllowed(grant.permission, grant.resourceType)) return false;
  return grant.scope !== 'resource' || Boolean(grant.resourceId);
};

const resourceExists = async (grant: z.infer<typeof grantSchema>) => {
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

export async function GET() {
  const guard = await requirePermission(['group.manage', 'group.assign']);
  if ('error' in guard) return guard.error;
  const { supabase } = guard;

  const [
    { data: groups, error },
    { data: grants },
    { data: memberships },
    { data: catalog },
    { data: articles },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from('user_groups')
      .select('id, name, description, is_default, created_at, updated_at')
      .order('name'),
    supabase
      .from('group_permission_grants')
      .select('group_id, permission_key, scope, resource_type, resource_id'),
    supabase.from('user_group_memberships').select('user_id, group_id'),
    supabase
      .from('permission_catalog')
      .select('key, category, label_zh, global_only, sort_order')
      .order('sort_order'),
    supabaseAdmin.from('articles').select('id, title').order('title'),
    supabaseAdmin.from('categories').select('id, name').order('name'),
  ]);

  if (error) return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  return NextResponse.json({
    catalog: catalog ?? [],
    resourceOptions: {
      ...getAllStaticPermissionResourceOptions(),
      articles: (articles ?? []).map((article) => ({ id: article.id, label: article.title })),
      'comments/articles': (articles ?? []).map((article) => ({
        id: article.id,
        label: article.title,
      })),
      categories: (categories ?? []).map((category) => ({
        id: category.id,
        label: category.name,
      })),
    },
    groups: (groups ?? []).map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      isDefault: group.is_default,
      memberCount: (memberships ?? []).filter((membership) => membership.group_id === group.id)
        .length,
      grants: (grants ?? [])
        .filter((grant) => grant.group_id === group.id)
        .map((grant): PermissionGrant => ({
          permission: grant.permission_key as PermissionGrant['permission'],
          scope: grant.scope,
          resourceType: grant.resource_type === '*' ? null : grant.resource_type,
          resourceId: grant.resource_id === '*' ? null : grant.resource_id,
        })),
    })),
  });
}

export async function POST(request: Request) {
  const guard = await requirePermission('group.manage');
  if ('error' in guard) return guard.error;
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.grants.some((grant) => !isValidGrant(grant))) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!(await Promise.all(parsed.data.grants.map(resourceExists))).every(Boolean)) {
    return NextResponse.json({ error: 'Unknown resource ID' }, { status: 400 });
  }
  const { data, error } = await guard.supabase.rpc('create_permission_group', {
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_is_default: parsed.data.isDefault,
    p_grants: toRpcGrants(parsed.data.grants),
  });
  if (error) {
    const status = error.message.includes('duplicate') ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ id: data }, { status: 201 });
}
