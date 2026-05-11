'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { shouldIgnorePageNavigationKey } from '@/lib/keyboardNavigation';
import { useEditMode } from '@/context/EditModeContext';

export default function KeyboardNavigation() {
  const router = useRouter();
  const { isEditMode } = useEditMode();

  useEffect(() => {
    if (isEditMode) return;

    function handler(e: KeyboardEvent) {
      if (e.key !== 'Backspace') return;
      if (shouldIgnorePageNavigationKey(e)) return;

      e.preventDefault();
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }

    window.addEventListener('keydown', handler, { passive: false });
    return () => window.removeEventListener('keydown', handler);
  }, [isEditMode, router]);

  return null;
}
