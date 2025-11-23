// Client-side performance monitoring hook
'use client';

import { useEffect } from 'react';

import { measurePageLoad } from '@/lib/performance';

export const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        measurePageLoad();
      });
    }
  }, []);

  return null;
};
