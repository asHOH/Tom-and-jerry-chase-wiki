import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import CategoryManagementPanelClient from './CategoryManagementPanelClient';

const CategoryManagementPanel = async () => {
  notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: roleData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (roleData?.role !== 'Coordinator') {
    notFound();
  }

  return <CategoryManagementPanelClient />;
};

export default CategoryManagementPanel;
