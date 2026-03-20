import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import AdminPanel from './AdminPanel';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    notFound();
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, nickname')
    .eq('id', authUser.id)
    .single();

  const user = {
    id: authUser.id,
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
