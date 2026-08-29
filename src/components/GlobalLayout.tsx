'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';

import TabNavigationWrapper from '@/components/TabNavigationWrapper';

import { DynamicFaviconEditBadge } from './DynamicFaviconEditBadge';

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  // Detail pages can switch between concise and detailed descriptions from the navigation bar.
  const showDetailToggle =
    (pathname.startsWith('/characters/') ||
      pathname.startsWith('/cards/') ||
      pathname.startsWith('/special-skills/') ||
      pathname.startsWith('/entities/') ||
      pathname.startsWith('/buffs/') ||
      pathname.startsWith('/items/') ||
      pathname.startsWith('/maps/') ||
      pathname.startsWith('/fixtures/') ||
      pathname.startsWith('/modes/')) &&
    pathname.split('/').length > 3;

  return (
    <>
      <DynamicFaviconEditBadge />
      <TabNavigationWrapper showDetailToggle={showDetailToggle}>
        <AnimatePresence mode='wait' initial={false}>
          <m.div
            key={pathname}
            initial={
              shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -15, filter: 'blur(2px)' }
            }
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.3, ease: 'easeOut' }}
          >
            {children}
          </m.div>
        </AnimatePresence>
      </TabNavigationWrapper>
    </>
  );
}
