'use client';

import { useEffect, useReducer, useState } from 'react';

import type { preparedModule } from '@/lib/preparedModule';

export function usePreparedComponent<T>(
  prepared: ReturnType<typeof preparedModule<T>>,
  enabled: boolean
) {
  const [Component, setComponent] = useState<T | undefined>(() => prepared.get());
  const [error, setError] = useState(false);
  const [attempt, retry] = useReducer((value: number) => value + 1, 0);

  useEffect(() => {
    if (!enabled) return;
    let disposed = false;
    setError(false);
    void prepared.load().then(
      (loaded) => {
        if (!disposed) setComponent(() => loaded.default);
      },
      (cause: unknown) => {
        console.warn('Unable to load a panel:', cause);
        if (!disposed) setError(true);
      }
    );
    return () => {
      disposed = true;
    };
  }, [attempt, enabled, prepared]);

  return { Component: prepared.get() ?? Component, error, retry };
}
