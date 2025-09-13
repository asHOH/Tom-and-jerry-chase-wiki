import React from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import UserManagementPanelClient from './UserManagementPanelClient';

const UserManagementPanel = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: roleData } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (roleData?.role !== 'Coordinator') {
    notFound();
  }

  return <UserManagementPanelClient />;
};

export default UserManagementPanel;
