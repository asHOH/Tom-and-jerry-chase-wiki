import { notFound } from 'next/navigation';

import { abilityFor, Actions, Subjects, type Role } from '@/lib/auth/permissions';
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

  const { data: userData } = await supabase
    .from('users')
    .select('role, nickname')
    .eq('id', userId)
    .single();

  // Check permissions server-side: only Reviewer+ can access admin
  const role = (userData?.role as Role | null) ?? null;
  const ability = abilityFor(role);
  if (!ability.can(Actions.APPROVE, Subjects.ARTICLE_VERSION)) {
    notFound();
  }

  return <AdminPanel />;
}
