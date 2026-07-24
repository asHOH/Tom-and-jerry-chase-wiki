import { usePathname } from 'next/navigation';

import { NAV_ITEMS } from '@/constants/navigation';
import { catCharacterIds, mouseCharacterIds } from '@/features/characters/data/characterMetadata';

const catCharacterIdSet = new Set<string>(catCharacterIds);
const mouseCharacterIdSet = new Set<string>(mouseCharacterIds);

export function useNavigationTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    if (pathname.startsWith(href)) return true;
    if (!href.startsWith('/factions/mouse') && !href.startsWith('/factions/cat')) return false;
    const slug = /^\/characters\/(?:user\/)?([^/]+)\/?$/.exec(pathname)?.[1];
    if (!slug) return false;
    const characterId = decodeURIComponent(slug);
    return (
      (catCharacterIdSet.has(characterId) && href.startsWith('/factions/cat')) ||
      (mouseCharacterIdSet.has(characterId) && href.startsWith('/factions/mouse'))
    );
  };

  return { items: NAV_ITEMS, isActive, pathname } as const;
}
