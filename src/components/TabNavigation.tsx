'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SearchBar from './ui/SearchBar'; // Import SearchBar
import Tooltip from './ui/Tooltip'; // Import Tooltip
import { useAppContext } from '@/context/AppContext';
import { useNavigation } from '@/lib/useNavigation';
import clsx from 'clsx';

type Tab = {
  id: string;
  name: string;
  imageSrc: string;
  imageAlt: string;
  path: string;
};

const tabs: Tab[] = [
  {
    id: 'cat',
    name: '猫阵营',
    imageSrc: '/images/icons/cat faction.png',
    imageAlt: '猫阵营图标',
    path: '/factions/cat',
  },
  {
    id: 'mouse',
    name: '鼠阵营',
    imageSrc: '/images/icons/mouse faction.png',
    imageAlt: '鼠阵营图标',
    path: '/factions/mouse',
  },
  {
    id: 'catCards',
    name: '猫方知识卡',
    imageSrc: '/images/icons/cat knowledge card.png',
    imageAlt: '猫方知识卡图标',
    path: '/cards/cat',
  },
  {
    id: 'mouseCards',
    name: '鼠方知识卡',
    imageSrc: '/images/icons/mouse knowledge card.png',
    imageAlt: '鼠方知识卡图标',
    path: '/cards/mouse',
  },
];

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { navigate } = useNavigation();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Reset navigation state when pathname changes
  useEffect(() => {
    if (navigatingTo && pathname) {
      // Check if the current pathname matches where we were navigating to
      if (pathname === navigatingTo || pathname.startsWith(navigatingTo)) {
        setNavigatingTo(null);
      }
    }
  }, [pathname, navigatingTo]);

  const handleNavigation = async (targetPath: string) => {
    setNavigatingTo(targetPath);
    try {
      const navigationSucceeded = await navigate(targetPath);
      // If navigation failed (blocked), reset the navigating state
      if (!navigationSucceeded) {
        setNavigatingTo(null);
      } else {
        // Reset after a short delay to allow navigation to complete
        setTimeout(() => setNavigatingTo(null), 2000);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigatingTo(null);
    }
  };

  const isTabActive = (tabPath: string) => {
    return pathname?.startsWith(tabPath) || false;
  };

  const isHomeActive = () => {
    return pathname === '/';
  };

  return (
    <div
      className='fixed top-0 left-0 right-0 bg-white shadow-md z-50 w-full py-2 dark:bg-slate-900 dark:shadow-lg'
    >
      <div
        className='flex justify-between items-center max-w-screen-xl mx-auto px-4'
      >
        {/* Left-aligned navigation buttons */}
        <div
          className={clsx(
            'flex',
            isMobile ? 'gap-2 overflow-x-auto' : 'gap-3',
            '[scrollbar-width:none] [-ms-overflow-style:\'none\'] [overflow-y:visible] relative'
          )}
        >
          <Tooltip content='首页' className='border-none' disabled={!isMobile} delay={800}>
            <button
              type='button'
              onClick={() => handleNavigation('/')}
              className={clsx(
                'whitespace-nowrap rounded-md border-none cursor-pointer transition-colors flex items-center justify-center',
                isMobile ? 'min-h-[40px] min-w-[40px] p-2 text-sm' : 'min-h-[44px] px-4 text-base',
                navigatingTo === '/'
                  ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                  : isHomeActive()
                    ? 'bg-blue-600 text-white dark:bg-blue-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
              )}
              disabled={navigatingTo !== null}
            >
              {!isMobile && '首页'}
              {isMobile && '🏠'}
            </button>
          </Tooltip>
          {tabs.map((tab) => (
            <Tooltip
              key={tab.id}
              content={tab.name}
              className='border-none'
              disabled={!isMobile}
              delay={800}
            >
              <button
                type='button'
                onClick={() => handleNavigation(tab.path)}
                className={clsx(
                  'whitespace-nowrap rounded-md border-none cursor-pointer transition-colors flex items-center justify-center',
                  isMobile ? 'min-h-[40px] p-2 text-sm gap-0' : 'min-h-[44px] px-4 text-base gap-2',
                  navigatingTo === tab.path
                    ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
                    : isTabActive(tab.path)
                      ? 'bg-blue-600 text-white dark:bg-blue-700'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
                )}
                disabled={navigatingTo !== null}
              >
                <Image
                  src={tab.imageSrc}
                  alt={tab.imageAlt}
                  width={64}
                  height={64}
                  className='object-contain'
                  style={{ height: isMobile ? '24px' : '28px', width: 'auto' }}
                />
                {!isMobile && <span>{tab.name}</span>}
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Right-aligned detailed/simple view toggle button and SearchBar */}
        <div className={clsx('flex items-center', isMobile ? 'gap-2' : 'gap-3')}>
          <SearchBar isMobile={isMobile} />
          {showDetailToggle && (
            <Tooltip
              content={isDetailedView ? '简明描述' : '详细描述'}
              className='border-none'
              disabled={!isMobile}
              delay={800}
            >
              <button
                type='button'
                onClick={toggleDetailedView}
                className={clsx(
                  'whitespace-nowrap rounded-md border-none cursor-pointer transition-colors',
                  isMobile ? 'min-h-[40px] p-2 text-sm' : 'min-h-[44px] px-4 text-base',
                  isDetailedView
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                )}
              >
                {isMobile ? (isDetailedView ? '简' : '详') : isDetailedView ? '简明' : '详细'}
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
