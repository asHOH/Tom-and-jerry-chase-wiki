import { notFound } from 'next/navigation';

import { hasPermission, type PermissionKey } from '@/lib/auth/permissions';
import { loadPermissionGrants } from '@/lib/auth/requirePermission';
import { createClient } from '@/lib/supabase/server';

import AdminPanel from './AdminPanel';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;

  if (!userId) {
    notFound();
  }

  const grants = await loadPermissionGrants(supabase);
  const adminPermissions: PermissionKey[] = [
    'article_version.approve',
    'category.create',
    'category.update',
    'category.delete',
    'game_data_action.approve',
    'game_data_action.reject',
    'game_data_action.revoke',
    'user.read',
    'user.update',
    'group.manage',
    'group.assign',
    'block.view',
    'block.manage',
    'notice.manage',
  ];
  const canAccessAdmin = adminPermissions.some((permission) => hasPermission(grants, permission));
  if (!canAccessAdmin) {
    notFound();
  }

  return <AdminPanel />;
}
