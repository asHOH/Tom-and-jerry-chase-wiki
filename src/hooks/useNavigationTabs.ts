import { NAV_ITEMS } from '@/constants/navigation';
import { usePathname } from 'next/navigation';

export function useNavigationTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => !!pathname && (pathname === href || pathname.startsWith(href));

  return { items: NAV_ITEMS, isActive, pathname } as const;
}
