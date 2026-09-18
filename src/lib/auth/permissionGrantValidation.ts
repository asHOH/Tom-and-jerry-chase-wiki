import 'server-only';

import { z } from 'zod';

import { requireSupabaseAdminClient } from '@/lib/supabase/adminClient';

import { isKnownStaticPermissionResource } from './permissionResources';
import { isPermissionKey } from './permissions';
import { isPermissionResourceTypeAllowed, isScopableResourceType } from './resourceContexts';

export const permissionGrantSchema = z
  .object({
    permission: z.string(),
    scope: z.enum(['global', 'resource_type', 'resource']),
    resourceType: z.string().trim().min(1).max(100).nullable(),
    resourceId: z.string().trim().min(1).max(200).nullable(),
  })
  .refine((grant) => {
    if (!isPermissionKey(grant.permission)) return false;
    if (grant.scope === 'global') return true;
    if (!grant.resourceType || !isScopableResourceType(grant.resourceType)) return false;
    if (!isPermissionResourceTypeAllowed(grant.permission, grant.resourceType)) return false;
    return grant.scope !== 'resource' || Boolean(grant.resourceId);
  });

export async function permissionGrantResourceExists(grant: z.infer<typeof permissionGrantSchema>) {
  if (grant.scope !== 'resource' || !grant.resourceType || !grant.resourceId) return true;
  const staticResult = isKnownStaticPermissionResource(grant.resourceType, grant.resourceId);
  if (staticResult !== null) return staticResult;
  const table = grant.resourceType === 'comments/articles' ? 'articles' : grant.resourceType;
  if (table !== 'articles' && table !== 'categories') return false;
  const { data } = await requireSupabaseAdminClient()
    .from(table)
    .select('id')
    .eq('id', grant.resourceId)
    .maybeSingle();
  return Boolean(data);
}
