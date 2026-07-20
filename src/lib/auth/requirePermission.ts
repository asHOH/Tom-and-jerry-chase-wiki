import { NextResponse } from 'next/server';

import {
  canAccess,
  canAccessAll,
  hasPermission,
  type PermissionGrant,
  type PermissionKey,
  type ResourceContext,
} from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';

type RequirePermissionSuccess = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  grants: PermissionGrant[];
};

type RequirePermissionResult =
  | RequirePermissionSuccess
  | { error: NextResponse; supabase?: never; userId?: never; grants?: never };

type RequirePermissionOrAnonymousResult =
  | RequirePermissionSuccess
  | {
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: null;
      grants: [];
    }
  | { error: NextResponse; supabase?: never; userId?: never; grants?: never };

export async function loadPermissionGrants(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PermissionGrant[]> {
  const { data, error } = await supabase.rpc('get_my_permission_grants');
  if (error || !data) return [];
  return data.map((row) => ({
    permission: row.permission_key as PermissionKey,
    scope: row.scope,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
  }));
}

export async function requirePermission(
  permission: PermissionKey | readonly PermissionKey[],
  contexts?: ResourceContext | readonly ResourceContext[],
  mode: 'any' | 'all' = 'all'
): Promise<RequirePermissionResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const grants = await loadPermissionGrants(supabase);
  const list = contexts ? (Array.isArray(contexts) ? contexts : [contexts]) : [];
  if (
    list.some(
      (context) =>
        !context.resourceType.trim() ||
        (context.resourceId !== undefined && !context.resourceId.trim())
    )
  ) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  const permissionKeys = Array.isArray(permission) ? permission : [permission];
  const allowed = permissionKeys.some((permissionKey) =>
    list.length === 0
      ? hasPermission(grants, permissionKey)
      : mode === 'all'
        ? canAccessAll(grants, permissionKey, list)
        : list.some((context) => canAccess(grants, permissionKey, context))
  );
  if (!allowed) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { supabase, userId, grants };
}

/**
 * Require a permission for authenticated callers while preserving the anonymous contributor
 * path used by game-data submissions.
 */
export async function requirePermissionOrAnonymous(
  permission: PermissionKey | readonly PermissionKey[],
  contexts?: ResourceContext | readonly ResourceContext[],
  mode: 'any' | 'all' = 'all'
): Promise<RequirePermissionOrAnonymousResult> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) return { supabase, userId: null, grants: [] };

  const grants = await loadPermissionGrants(supabase);
  const list = contexts ? (Array.isArray(contexts) ? contexts : [contexts]) : [];
  if (
    list.some(
      (context) =>
        !context.resourceType.trim() ||
        (context.resourceId !== undefined && !context.resourceId.trim())
    )
  ) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  const permissionKeys = Array.isArray(permission) ? permission : [permission];
  const allowed = permissionKeys.some((permissionKey) =>
    list.length === 0
      ? hasPermission(grants, permissionKey)
      : mode === 'all'
        ? canAccessAll(grants, permissionKey, list)
        : list.some((context) => canAccess(grants, permissionKey, context))
  );
  if (!allowed) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { supabase, userId, grants };
}
