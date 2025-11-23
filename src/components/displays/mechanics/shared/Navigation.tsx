'use client';

import { MECHANICS_NAV_ITEMS } from '@/constants/navigation';
import clsx from 'clsx';

import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import PageDescription from '@/components/ui/PageDescription';
import PageTitle from '@/components/ui/PageTitle';
import Image from '@/components/Image';
import Link from '@/components/Link';

interface MechanicsNavigationProps {
  children?: React.ReactNode;
  description?: string;
}

export default function MechanicsNavigation({ children, description }: MechanicsNavigationProps) {
  const isMobile = useMobile();
  const { isActive } = useNavigationTabs();
  const isTabActive = (tabPath: string) => isActive(tabPath);

  return (
    <div
      className={
        isMobile
          ? 'mx-auto max-w-3xl space-y-2 p-2 dark:text-slate-200'
          : 'mx-auto max-w-6xl space-y-8 p-6 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'mb-2 space-y-2 px-2 text-center' : 'mb-4 space-y-4 px-4 text-center'}
      >
        <PageTitle>局内机制</PageTitle>
        <PageDescription>{description}</PageDescription>
      </header>

      <div className='grid items-center justify-center'>
        <div className='flex flex-wrap items-center gap-4 text-sm font-normal'>
          {MECHANICS_NAV_ITEMS.map((tab, index) => (
            <li
              key={index}
              className={clsx(
                `flex items-center overflow-hidden rounded-lg border-1 border-dotted border-gray-500 transition-colors`,
                !isTabActive(tab.href) && 'hover:-translate-y-1'
              )}
            >
              <Link
                href={tab.href}
                className={clsx(
                  'flex h-full w-full items-center gap-2 px-3 py-1',
                  isTabActive(tab.href)
                    ? 'pointer-events-none cursor-not-allowed bg-blue-600 text-white dark:bg-blue-700'
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
                )}
                tabIndex={0}
              >
                <Image
                  src={tab.iconSrc}
                  alt={tab.iconAlt}
                  className='h-10 w-10 object-contain py-0.5'
                  width={90}
                  height={90}
                />
                <span className='truncate text-base dark:text-white'>{tab.label}</span>
              </Link>
            </li>
          ))}
        </div>
      </div>

      <div className='border-t-2 border-b-2 border-dashed border-gray-300 dark:border-gray-700'>
        {children}
      </div>
    </div>
  );
}
