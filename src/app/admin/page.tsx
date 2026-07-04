import { notFound } from 'next/navigation';

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

  const user = {
    id: userId,
    nickname: userData?.nickname ?? '',
    role: userData?.role ?? null,
  };

  // Check roles server-side
  if (user.role === 'Contributor' || !user.role) {
    // Only Coordinator and Reviewer can access
    // Note: The client component also checks this, but we double check here
    // to prevent access to the shell.
    notFound();
  }

  return <AdminPanel user={user} />;
}
