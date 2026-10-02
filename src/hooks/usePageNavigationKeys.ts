import { useEffect } from 'react';

import { shouldIgnorePageNavigationKey } from '@/lib/keyboardNavigation';

export function usePageNavigationKeys(
  previous: (() => void) | undefined,
  next: (() => void) | undefined,
  disabled = false
) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      if (shouldIgnorePageNavigationKey(event)) return;

      switch (event.key) {
        case 'ArrowLeft':
        case 'h':
          event.preventDefault();
          previous?.();
          break;
        case 'ArrowRight':
        case 'l':
          event.preventDefault();
          next?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, previous, next]);
}
