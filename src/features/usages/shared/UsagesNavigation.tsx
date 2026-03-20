'use client';

import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import ActionTile from '@/components/ui/ActionTile';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Image from '@/components/Image';

import { USAGES_NAV_ITEMS } from '../sections';

interface UsagesNavigationProps {
  children?: React.ReactNode;
  description?: string;
}

interface NavigationButtonsProps {
  isMobile: boolean;
  isTabActive: (tabPath: string) => boolean;
}

const NavigationButtons = ({ isMobile, isTabActive }: NavigationButtonsProps) => (
  <div className='grid items-center justify-center'>
    <ul
      className={`flex flex-wrap items-center ${isMobile ? 'gap-2' : 'gap-4'} text-sm font-normal`}
    >
      {USAGES_NAV_ITEMS.map((tab) => {
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
                  className={`${isMobile ? 'h-7 w-7' : 'h-10 w-10'} object-contain py-0.5`}
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

export default function UsagesNavigation({ children, description }: UsagesNavigationProps) {
  const isMobile = useMobile();
  const { isActive } = useNavigationTabs();
  const isTabActive = (tabPath: string) => isActive(tabPath);

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-4 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header className={isMobile ? 'mb-2 text-center' : 'mb-4 space-y-4 px-4 text-center'}>
        <PageTitle>网站说明</PageTitle>
        <PageDescription>{description}</PageDescription>
      </header>

      <NavigationButtons isMobile={isMobile} isTabActive={isTabActive} />

      <div className='border-t-2 border-b-2 border-dashed border-gray-300 dark:border-gray-700'>
        {children}
      </div>

      <NavigationButtons isMobile={isMobile} isTabActive={isTabActive} />
    </div>
  );
}
