'use client';

import { useEffect, useState } from 'react';

import { OFFICIAL_SITES } from '@/data/officialSites';
import ActionTile from '@/components/ui/ActionTile';
import { HOME_ACTION_TILE_PROPS } from '@/components/ui/homeActionTileStyles';
import { GlobeIcon } from '@/components/icons/CommonIcons';

const HIDDEN_SITE_HASH = '8a421bd68f71baf196bb5272a38aff89675310595276fd957ee73167f5017a00';

export default function OfficialSitesDisplay() {
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [isHiddenSite, setIsHiddenSite] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin;
    setCurrentOrigin(origin);

    const checkHidden = async () => {
      try {
        if (!crypto || !crypto.subtle) return;
        const msgBuffer = new TextEncoder().encode(origin);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        if (hashHex === HIDDEN_SITE_HASH) {
          setIsHiddenSite(true);
        }
      } catch (e) {
        console.error('Error checking site hash', e);
      }
    };

    checkHidden();
  }, []);

  const isCurrentSite = (siteUrl: string, isMain?: boolean) => {
    if (!currentOrigin) return false;

    // Direct match (ignoring trailing slash for safety)
    const normalize = (u: string) => u.replace(/\/$/, '');
    if (normalize(currentOrigin) === normalize(siteUrl)) return true;

    // Hidden site maps to main site
    if (isMain && isHiddenSite) return true;

    return false;
  };

  return (
    <div className='flex flex-wrap justify-center gap-4'>
      {OFFICIAL_SITES.map((site) => {
        const active = isCurrentSite(site.url, site.isMain);
        return (
          <ActionTile
            key={site.url}
            href={site.url}
            external
            ariaLabel={site.label}
            description={site.description}
            icon={<GlobeIcon className='h-8 w-8' />}
            layout='stacked'
            title={site.label}
            tone={active ? 'active' : 'default'}
            {...HOME_ACTION_TILE_PROPS}
          />
        );
      })}
    </div>
  );
}
