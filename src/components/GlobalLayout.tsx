'use client';

import { usePathname } from 'next/navigation';

import { EditModeProvider } from '@/context/EditModeContext';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Determine if the detailed toggle should be shown
  // It should be shown for character details and card details
  // Character details: /characters/[id] (but not /characters)
  // Card details: /cards/[id] (but not /cards)
  // Note: /characters/user/[id] is also a character detail page

  const showDetailToggle =
    (pathname.startsWith('/characters/') ||
      pathname.startsWith('/cards/') ||
      pathname.startsWith('/special-skills/') ||
      pathname.startsWith('/entities/') ||
      pathname.startsWith('/buffs/') ||
      pathname.startsWith('/items/')) &&
    pathname.split('/').length > 3;

  return (
    <EditModeProvider>
      <TabNavigationWrapper showDetailToggle={showDetailToggle}>{children}</TabNavigationWrapper>
    </EditModeProvider>
  );
}
