'use client';

import type { ReactNode } from 'react';

import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import Image from '@/components/Image';

import ActionTile from './ActionTile';
import PageHeader from './PageHeader';
import PageShell from './PageShell';

export type SectionNavigationItem = {
  label: string;
  href: string;
  iconSrc: string;
  iconAlt: string;
};

export type SectionNavigationShellProps = {
  title: ReactNode;
  description?: ReactNode;
  items: readonly SectionNavigationItem[];
  bottomNavigation: 'always' | 'when-active';
  children?: ReactNode;
};

type NavigationButtonsProps = {
  items: readonly SectionNavigationItem[];
  isMobile: boolean;
  isTabActive: (tabPath: string) => boolean;
};

function NavigationButtons({ items, isMobile, isTabActive }: NavigationButtonsProps) {
  return (
    <div className='grid items-center justify-center'>
      <ul className='flex flex-wrap items-center gap-2 text-sm font-normal md:gap-4'>
        {items.map((tab) => {
          const active = isTabActive(tab.href);

          return (
            <li key={tab.href} className='list-none'>
              <ActionTile
                href={tab.href}
                ariaLabel={tab.label}
                icon={
                  <Image
                    src={tab.iconSrc}
                    alt={tab.iconAlt}
                    className='h-7 w-7 object-contain py-0.5 md:h-10 md:w-10'
                    width={90}
                    height={90}
                  />
                }
                interaction={active ? 'current-page' : 'normal'}
                size={isMobile ? 'sm' : 'md'}
                title={tab.label}
                tone={active ? 'active' : 'default'}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SectionNavigationShell({
  title,
  description,
  items,
  bottomNavigation,
  children,
}: SectionNavigationShellProps) {
  const isMobile = useMobile();
  const { isActive } = useNavigationTabs();
  const hasActiveItem = items.some((tab) => isActive(tab.href));
  const showBottomNavigation = bottomNavigation === 'always' || hasActiveItem;

  return (
    <PageShell width='maximum' className='space-y-4 md:space-y-8 dark:text-slate-200'>
      <PageHeader
        title={title}
        titleAs={hasActiveItem ? 'p' : 'h1'}
        description={description}
        className='mb-2 md:mb-4'
      />

      <NavigationButtons items={items} isMobile={isMobile} isTabActive={isActive} />

      <div className='border-t-2 border-b-2 border-dashed border-gray-300 dark:border-gray-700'>
        {children}
      </div>

      {showBottomNavigation ? (
        <NavigationButtons items={items} isMobile={isMobile} isTabActive={isActive} />
      ) : null}
    </PageShell>
  );
}
