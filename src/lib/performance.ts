// Performance monitoring utilities for production analysis

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
