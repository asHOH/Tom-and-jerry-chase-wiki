import { NAV_ITEMS } from '@/constants/navigation';
import { characters } from '@/data';
import { usePathname } from 'next/navigation';

export function useNavigationTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (pathname.startsWith(href)) return true;
    if (!href.startsWith('/factions/mouse') && !href.startsWith('/factions/cat')) return false;
    const slug = /^\/characters\/([^/]*)\/?$/.exec(pathname)?.[1];
    if (!slug) return false;
    const character = characters[decodeURIComponent(slug)];
    return (
      (character?.factionId === 'cat' && href.startsWith('/factions/cat')) ||
      (character?.factionId === 'mouse' && href.startsWith('/factions/mouse'))
    );
  };

  return { items: NAV_ITEMS, isActive, pathname } as const;
}
