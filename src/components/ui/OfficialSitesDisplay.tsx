'use client';

import { useEffect, useState } from 'react';
import { OFFICIAL_SITES } from '@/data/officialSites';

const HIDDEN_SITE_HASH = '8a421bd68f71baf196bb5272a38aff89675310595276fd957ee73167f5017a00';

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    fill='none'
    viewBox='0 0 24 24'
    strokeWidth={1.5}
    stroke='currentColor'
    className={className}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      d='M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S7.5 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418'
    />
  </svg>
);

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
          <a
            key={site.url}
            href={site.url}
            target='_blank'
            rel='noopener noreferrer'
            className={`flex min-w-[180px] flex-col items-center justify-center gap-2 rounded-md border-none px-6 py-4 text-center shadow-md transition-colors duration-200 focus:outline-none ${
              active
                ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500 dark:bg-blue-900/40 dark:text-blue-100 dark:ring-blue-400'
                : 'bg-gray-200 text-gray-800 dark:bg-black dark:text-gray-200 dark:hover:bg-gray-900'
            } `}
          >
            <div className='flex items-center gap-3'>
              <GlobeIcon className='h-8 w-8' />
              <span className='text-2xl font-bold whitespace-nowrap'>{site.label}</span>
            </div>
            <div
              className={`mt-1 text-sm ${active ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {site.description}
            </div>
          </a>
        );
      })}
    </div>
  );
}
