'use client';

import { useEffect, useState } from 'react';

export function useScrollSpy(sectionIds: readonly string[]) {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    let frame = 0;
    const update = () => {
      let currentId = '';
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element || element.closest('[aria-hidden="true"], [hidden]')) continue;
        if (!currentId) currentId = id;
        const offset = Math.max(128, parseFloat(getComputedStyle(element).scrollMarginTop) || 0);
        if (element.getBoundingClientRect().top <= offset) currentId = id;
        else break;
      }
      setActiveSection(currentId);
    };
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('hashchange', scheduleUpdate);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('hashchange', scheduleUpdate);
    };
  }, [sectionIds]);

  return activeSection;
}
