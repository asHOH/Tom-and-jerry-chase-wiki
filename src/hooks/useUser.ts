import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export const useUser = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data?.user?.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          setRole(data?.role || null);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setRole(null);
      }
    };

    fetchUserRole();
  }, []);

  return { role };
};
