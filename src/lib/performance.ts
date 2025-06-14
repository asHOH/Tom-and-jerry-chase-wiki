// Performance monitoring utilities for production analysis

// Type definitions for performance entries
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export const measurePageLoad = () => {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') return;

  // Measure Core Web Vitals
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        const navigation = entry as PerformanceNavigationTiming;
        console.log('Page Load Performance:', {
          domContentLoaded:
            navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          firstByte: navigation.responseStart - navigation.requestStart,
        });
      }
    });
  });

  observer.observe({ entryTypes: ['navigation'] });
};

// Measure Largest Contentful Paint (LCP)
export const measureLCP = (callback?: (value: number) => void) => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      const lcp = lastEntry.startTime;
      callback?.(lcp);
      if (process.env.NODE_ENV === 'development') {
        console.log('LCP:', lcp);
      }
    }
  });

  observer.observe({ entryTypes: ['largest-contentful-paint'] });
};

// Measure First Input Delay (FID)
export const measureFID = (callback?: (value: number) => void) => {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    const firstInput = list.getEntries()[0] as PerformanceEventTiming;
    if (firstInput) {
      const fid = firstInput.processingStart - firstInput.startTime;
      callback?.(fid);
      if (process.env.NODE_ENV === 'development') {
        console.log('FID:', fid);
      }
    }
  });

  observer.observe({ entryTypes: ['first-input'] });
};

// Measure Cumulative Layout Shift (CLS)
export const measureCLS = (callback?: (value: number) => void) => {
  if (typeof window === 'undefined') return;

  let clsValue = 0;
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      const layoutShift = entry as LayoutShiftEntry;
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value;
      }
    });
    callback?.(clsValue);
    if (process.env.NODE_ENV === 'development') {
      console.log('CLS:', clsValue);
    }
  });

  observer.observe({ entryTypes: ['layout-shift'] });
};
