'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase/client';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/context/ToastContext';

const CONTRIBUTIONS_PATH = '/contributions/';

/**
 * Shows the next useful action after a contribution is submitted while leaving
 * the caller in control of its existing stay/redirect behavior.
 */
export function useContributionSubmissionFeedback() {
  const router = useRouter();
  const { nickname } = useUser();
  const { success, successWithAction } = useToast();

  return useCallback(
    (message: string) => {
      const showFeedback = async () => {
        let isAuthenticated = Boolean(nickname);

        if (!isAuthenticated && hasSupabasePublicConfig()) {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            isAuthenticated = Boolean(session?.user);
          } catch {
            // Fall back to the anonymous message when session detection is unavailable.
          }
        }

        if (isAuthenticated) {
          successWithAction(message, '查看我的贡献', () => router.push(CONTRIBUTIONS_PATH), 8000);
          return;
        }

        success(`${message} 登录后可查看进度并收到审核反馈。`, 8000);
      };

      void showFeedback();
    },
    [nickname, router, success, successWithAction]
  );
}
