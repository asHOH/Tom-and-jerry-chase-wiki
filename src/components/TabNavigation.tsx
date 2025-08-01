'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import SearchBar from './ui/SearchBar'; // Import SearchBar
import Tooltip from './ui/Tooltip'; // Import Tooltip
import { useAppContext } from '@/context/AppContext';
import { useNavigation } from '@/lib/useNavigation';
import { useMobile } from '@/hooks/useMediaQuery';
import clsx from 'clsx';
import { DarkModeToggleButton } from './ui/DarkModeToggleButton';

// Helper function for button styling
const getButtonClassName = (isMobile: boolean, isNavigating: boolean, isActive: boolean) => {
  const baseClasses =
    'whitespace-nowrap rounded-md border-none cursor-pointer transition-colors flex items-center justify-center';
  const sizeClasses = isMobile ? 'min-h-[40px] p-2 text-sm' : 'min-h-[44px] px-4 text-base';

  const stateClasses = isNavigating
    ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
    : isActive
      ? 'bg-blue-600 text-white dark:bg-blue-700'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600';

  return clsx(baseClasses, sizeClasses, stateClasses);
};

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
    id: 'cards',
    name: '知识卡',
    imageSrc: '/images/icons/cat knowledge card.png',
    imageAlt: '知识卡图标',
    path: '/cards',
  },
  {
    id: 'special-skills',
    name: '特技',
    imageSrc: '/images/mouseSpecialSkills/%E5%BA%94%E6%80%A5%E6%B2%BB%E7%96%97.png',
    imageAlt: '特技图标',
    path: '/special-skills',
  },
  {
    id: 'items',
    name: '道具',
    imageSrc: '/images/items/%E7%9B%98%E5%AD%90.png',
    imageAlt: '道具图标',
    path: '/items',
  },
];

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { navigate } = useNavigation();
  const isMobile = useMobile();

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
    <div className='fixed top-0 left-0 right-0 bg-white shadow-md z-50 w-full py-2 dark:bg-slate-900 dark:shadow-lg'>
      <div className='flex justify-between items-center max-w-screen-xl mx-auto px-4 gap-4'>
        {/* Left-aligned navigation buttons */}
        <div
          className={clsx(
            'flex',
            isMobile ? 'gap-1 overflow-x-auto' : 'gap-3',
            "[scrollbar-width:none] [-ms-overflow-style:'none'] [overflow-y:visible] relative"
          )}
        >
          <Tooltip content='首页' className='border-none' disabled={!isMobile} delay={800}>
            <button
              type='button'
              onClick={() => handleNavigation('/')}
              className={clsx(
                getButtonClassName(isMobile, navigatingTo === '/', isHomeActive()),
                isMobile && 'min-w-[40px]'
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
                  getButtonClassName(isMobile, navigatingTo === tab.path, isTabActive(tab.path)),
                  isMobile ? 'gap-0' : 'gap-2'
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
        <div className={clsx('flex items-center', isMobile ? 'gap-1' : 'gap-3')}>
          {pathname === '/' || pathname === '' ? <DarkModeToggleButton /> : <SearchBar />}
          {showDetailToggle && (
            <Tooltip
              content={isDetailedView ? '切换至简明描述' : '切换至详细描述'}
              className='border-none'
              disabled={!isMobile}
              delay={800}
            >
              <div
                className={clsx(
                  'relative flex rounded-lg dark:border-gray-600 bg-gray-100 dark:bg-slate-800 p-1 cursor-pointer transition-all duration-200',
                  isMobile ? 'min-h-[40px]' : 'min-h-[44px]'
                )}
                onClick={toggleDetailedView}
              >
                {/* Background slider */}
                <div
                  className={clsx(
                    'absolute top-1 bottom-1 rounded-md shadow-sm transition-all duration-200 ease-out w-[calc(50%-4px)]',
                    isDetailedView
                      ? 'left-1 transform translate-x-full bg-orange-100 dark:bg-orange-900'
                      : 'left-1 transform translate-x-0 bg-blue-100 dark:bg-blue-900'
                  )}
                />

                {/* Simple option */}
                <div
                  className={clsx(
                    'relative z-10 flex items-center justify-center transition-colors duration-200 whitespace-nowrap',
                    isMobile ? 'px-2 py-1 text-xs font-medium' : 'px-2.5 py-2 text-sm font-medium',
                    !isDetailedView
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-500'
                  )}
                >
                  {isMobile ? '简' : '简明'}
                </div>

                {/* Detailed option */}
                <div
                  className={clsx(
                    'relative z-10 flex items-center justify-center transition-colors duration-200 whitespace-nowrap',
                    isMobile ? 'px-2 py-1 text-xs font-medium' : 'px-2.5 py-2 text-sm font-medium',
                    isDetailedView
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-500'
                  )}
                >
                  {isMobile ? '详' : '详细'}
                </div>
              </div>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
}
