'use client';

import { useMobile } from '@/hooks/useMediaQuery';
import PageTitle from '@/components/ui/PageTitle';
import PageDescription from '@/components/ui/PageDescription';
import { MECHANICS_NAV_ITEMS } from '@/constants/navigation';
import Image from '@/components/Image';
import clsx from 'clsx';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import Link from 'next/link';

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
          ? 'max-w-3xl mx-auto p-2 space-y-2 dark:text-slate-200'
          : 'max-w-6xl mx-auto p-6 space-y-8 dark:text-slate-200'
      }
    >
      <header
        className={isMobile ? 'text-center space-y-2 mb-2 px-2' : 'text-center space-y-4 mb-4 px-4'}
      >
        <PageTitle>局内机制</PageTitle>
        <PageDescription>{description}</PageDescription>
      </header>

      <div className='grid items-center justify-center'>
        <div className='text-sm font-normal gap-4 flex flex-wrap items-center'>
          {MECHANICS_NAV_ITEMS.map((tab, index) => (
            <li
              key={index}
              className={clsx(
                `flex items-center rounded-lg transition-colors border-1 border-gray-500 border-dotted overflow-hidden`,
                !isTabActive(tab.href) && 'hover:-translate-y-1'
              )}
            >
              <Link
                href={tab.href}
                className={clsx(
                  'flex items-center gap-2 w-full h-full px-3 py-1',
                  isTabActive(tab.href)
                    ? 'bg-blue-600 text-white dark:bg-blue-700 cursor-not-allowed pointer-events-none'
                    : 'bg-gray-200  hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
                )}
                tabIndex={0}
              >
                <Image
                  src={tab.iconSrc}
                  alt={tab.iconAlt}
                  className='w-10 h-10 object-contain py-0.5'
                  width={90}
                  height={90}
                />
                <span className='text-base dark:text-white truncate'>{tab.label}</span>
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
