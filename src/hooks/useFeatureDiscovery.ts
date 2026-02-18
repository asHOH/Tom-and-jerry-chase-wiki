import { useCallback, useEffect, useState } from 'react';

const STORAGE_PREFIX = 'feature_discovered_';

/**
 * Tracks whether a user has discovered (interacted with) a feature.
 * Returns `shouldPrompt: true` until the feature is dismissed,
 * at which point it's permanently stored in localStorage.
 */
export function useFeatureDiscovery(featureKey: string) {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + featureKey);
      if (!stored) {
        setShouldPrompt(true);
      }
    } catch {
      // localStorage unavailable — don't prompt
    }
  }, [featureKey]);

  const dismiss = useCallback(() => {
    setShouldPrompt(false);
    try {
      localStorage.setItem(STORAGE_PREFIX + featureKey, '1');
    } catch {
      // Ignore storage failures
    }
  }, [featureKey]);

  return { shouldPrompt, dismiss };
}
