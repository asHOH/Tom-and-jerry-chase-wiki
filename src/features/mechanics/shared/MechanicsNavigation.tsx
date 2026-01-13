'use client';

import clsx from 'clsx';

import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Image from '@/components/Image';
import Link from '@/components/Link';

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
    <div
      className={`flex flex-wrap items-center ${isMobile ? 'gap-2' : 'gap-4'} text-sm font-normal`}
    >
      {MECHANICS_NAV_ITEMS.map((tab, index) => (
        <li
          key={index}
          className={clsx(
            'faction-button transition-all duration-300',
            'flex items-center overflow-hidden rounded-lg shadow-md',
            isTabActive(tab.href)
              ? 'bg-blue-600 text-white dark:bg-blue-700'
              : 'bg-gray-200 hover:-translate-y-1 hover:bg-blue-600 hover:text-white dark:bg-slate-700 dark:hover:bg-blue-600'
          )}
        >
          <Link
            href={tab.href}
            className={clsx(
              'flex w-full items-center py-1 transition-colors duration-300',
              isTabActive(tab.href)
                ? 'pointer-events-none cursor-not-allowed'
                : 'text-gray-800 dark:text-gray-200 dark:hover:text-white',
              isMobile ? 'h-9 gap-1 px-1' : 'h-12 gap-2 px-2'
            )}
            tabIndex={0}
          >
            <Image
              src={tab.iconSrc}
              alt={tab.iconAlt}
              className={`${isMobile ? 'h-7 w-7' : 'h-10 w-10'} object-contain py-0.5`}
              width={90}
              height={90}
            />{' '}
            <span
              className={clsx(
                'truncate',
                isTabActive(tab.href) && 'text-white',
                isMobile ? 'text-xs' : 'text-sm'
              )}
            >
              {tab.label}
            </span>
          </Link>
        </li>
      ))}
    </div>
  </div>
);

export default function MechanicsNavigation({ children, description }: MechanicsNavigationProps) {
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
