import { useCallback, useEffect, useState } from 'react';

import { getFeatureDiscoveryStorageKey, storage } from '@/lib/localStorage';

/**
 * Tracks whether a user has discovered (interacted with) a feature.
 * Returns `shouldPrompt: true` until the feature is dismissed,
 * at which point it's permanently stored in localStorage.
 */
export function useFeatureDiscovery(featureKey: string) {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const storageKey = getFeatureDiscoveryStorageKey(featureKey);

  useEffect(() => {
    const stored = storage.getItem(storageKey);
    if (!stored) {
      setShouldPrompt(true);
    }
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setShouldPrompt(false);
    storage.setItem(storageKey, '1');
  }, [storageKey]);

  return { shouldPrompt, dismiss };
}
