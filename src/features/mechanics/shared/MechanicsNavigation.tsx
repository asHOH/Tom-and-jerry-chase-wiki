'use client';

import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import ActionTile from '@/components/ui/ActionTile';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Image from '@/components/Image';

import { MECHANICS_NAV_ITEMS } from '../sections';

interface MechanicsNavigationProps {
  children?: React.ReactNode;
  description?: string;
}

interface NavigationButtonsProps {
  isMobile: boolean;
  isTabActive: (tabPath: string) => boolean;
}

const NavigationButtons = ({ isMobile, isTabActive }: NavigationButtonsProps) => (
  <div className='grid items-center justify-center'>
    <ul className='flex flex-wrap items-center gap-2 text-sm font-normal md:gap-4'>
      {MECHANICS_NAV_ITEMS.map((tab) => {
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

export default function MechanicsNavigation({ children, description }: MechanicsNavigationProps) {
  const isMobile = useMobile();
  const { isActive } = useNavigationTabs();
  const isTabActive = (tabPath: string) => isActive(tabPath);

  return (
    <div className='mx-auto max-w-3xl space-y-4 md:max-w-6xl md:space-y-8 md:p-6 dark:text-slate-200'>
      <header className='mb-2 text-center md:mb-4 md:space-y-4 md:px-4'>
        <PageTitle>局内机制</PageTitle>
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
