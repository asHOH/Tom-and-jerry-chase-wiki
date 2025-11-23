'use client';

import { useEffect, useState, useRef } from 'react';

interface ScrollSpyOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useScrollSpy(sectionIds: string[], options: ScrollSpyOptions = {}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { threshold = 0.5, rootMargin = '-20% 0px -20% 0px' } = options;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);

        if (visibleEntries.length === 0) return;

        // Sort by intersection ratio (descending) and then by position (ascending)
        visibleEntries.sort((a, b) => {
          const ratioA = a.intersectionRatio;
          const ratioB = b.intersectionRatio;

          if (ratioA !== ratioB) {
            return ratioB - ratioA; // Higher ratio first
          }

          // If ratios are equal, prefer the one that's higher on the page
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });

        const mostVisible = visibleEntries[0];
        if (mostVisible) {
          setActiveSection(mostVisible.target.id);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current = observer;

    // Observe all sections
    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [sectionIds, threshold, rootMargin]);

  return activeSection;
}
