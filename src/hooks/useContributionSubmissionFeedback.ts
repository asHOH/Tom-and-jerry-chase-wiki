'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { getOptionalSupabaseBrowserClient } from '@/lib/supabase/browserClient';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { getUserSubmissionHref } from '@/lib/users/profileRoutes';
import { useUser } from '@/hooks/useUser';
import { useToast } from '@/context/ToastContext';

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
        let currentNickname = nickname;

        if (!isAuthenticated && hasSupabasePublicConfig()) {
          try {
            const supabase = getOptionalSupabaseBrowserClient();
            if (supabase) {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              isAuthenticated = Boolean(session?.user);
            }
          } catch {
            // Fall back to the anonymous message when session detection is unavailable.
          }
        }

        if (isAuthenticated) {
          if (!currentNickname) {
            try {
              const response = await fetch('/api/auth/me', {
                headers: { 'Content-Type': 'application/json' },
              });
              if (response.ok) {
                const data = (await response.json().catch(() => null)) as {
                  nickname?: unknown;
                } | null;
                currentNickname =
                  typeof data?.nickname === 'string' && data.nickname.trim()
                    ? data.nickname.trim()
                    : null;
              }
            } catch {
              // The user provider may still be synchronizing after authentication.
            }
          }

          if (currentNickname) {
            const submissionsPath = getUserSubmissionHref(currentNickname);
            successWithAction(message, '查看我的贡献', () => router.push(submissionsPath), 8000);
          } else {
            success(`${message} 登录状态正在同步，请刷新后重试。`, 8000);
          }
          return;
        }

        success(`${message} 登录后可查看进度并收到审核反馈。`, 8000);
      };

      void showFeedback();
    },
    [nickname, router, success, successWithAction]
  );
}
