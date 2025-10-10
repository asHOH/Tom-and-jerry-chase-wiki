'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/components/Image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './ui/SearchBar';
import Tooltip from './ui/Tooltip';
import { useAppContext } from '@/context/AppContext';
import clsx from 'clsx';
import { DarkModeToggleButton } from './ui/DarkModeToggleButton';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useEditMode } from '@/context/EditModeContext';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import { UserCircleIcon } from '@/components/icons/CommonIcons';

// Helper function for button styling
const getButtonClassName = (isNavigating: boolean, isActive: boolean) => {
  const baseClasses =
    'flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-md border-none px-2 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300 md:px-2.5 md:min-h-[44px] lg:px-3.5 lg:text-base';

  const stateClasses = isNavigating
    ? 'bg-gray-400 text-white cursor-not-allowed opacity-80'
    : isActive
      ? 'bg-blue-600 text-white dark:bg-blue-700'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600';

  return clsx(baseClasses, stateClasses);
};

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  // Ensure client-only UI matches server HTML on first paint
  const [mounted, setMounted] = useState(false);
  const [isCompactMode, setIsCompactMode] = useState(false);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { nickname, role, clearData: clearUserData } = useUser();
  const { isEditMode } = useEditMode();
  const { items, isActive } = useNavigationTabs();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const shouldCompact = window.innerWidth < 480;
      setIsCompactMode(shouldCompact);
      if (!shouldCompact) {
        setOverflowOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset navigation state when pathname changes
  useEffect(() => {
    if (navigatingTo && pathname) {
      // Check if the current pathname matches where we were navigating to
      if (pathname === navigatingTo || pathname.startsWith(navigatingTo)) {
        setNavigatingTo(null);
      }
    }
    setOverflowOpen(false);
    setUserDropdownOpen(false);
  }, [pathname, navigatingTo]);

  const isTabActive = (tabPath: string) => isActive(tabPath);

  const isHomeActive = () => {
    return pathname === '/';
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSignOutError(null);
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setSignOutError(error.message || '退出登录失败，请稍后再试');
        return;
      }
      clearUserData();
      setUserDropdownOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setSignOutError(msg);
    } finally {
      setSigningOut(false);
    }
  };

  const primaryTabs = isCompactMode ? items.slice(0, 2) : items;
  const overflowTabs = isCompactMode ? items.slice(2) : [];

  const compactButtonSizing = isCompactMode ? 'min-w-[40px]' : undefined;
  const compactHomeSizing = isCompactMode ? 'min-w-[40px]' : 'lg:min-w-fit';
  const tabIconClassName = clsx(
    'h-6 object-contain md:h-7',
    isCompactMode ? 'w-6 flex-shrink-0 md:w-7' : 'w-auto'
  );

  return (
    <div className='fixed top-0 left-0 right-0 bg-white shadow-md z-50 w-full py-2 dark:bg-slate-900 dark:shadow-lg'>
      <div className='flex justify-between items-center max-w-screen-xl mx-auto px-4 gap-4'>
        {/* Left-aligned navigation buttons */}
        <div className={clsx('relative flex flex-wrap gap-1 md:flex-nowrap md:gap-2 lg:gap-2.5')}>
          {/* <span
            aria-hidden
            className='pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent dark:from-slate-900 md:hidden'
          />
          <span
            aria-hidden
            className='pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent dark:from-slate-900 md:hidden'
          /> */}
          <Tooltip content='首页' className='border-none'>
            <Link
              href='/'
              className={clsx(
                getButtonClassName(navigatingTo === '/', isHomeActive()),
                'relative',
                compactHomeSizing,
                navigatingTo === '/' && 'pointer-events-none opacity-80'
              )}
              aria-label='首页'
              onClick={() => {
                if (navigatingTo === '/') return;
                setNavigatingTo('/');
              }}
              tabIndex={navigatingTo === '/' ? -1 : 0}
              aria-disabled={navigatingTo === '/'}
            >
              <span className='lg:hidden' aria-hidden='true'>
                🏠
              </span>
              <span className='hidden lg:inline'>首页</span>
              <span className='sr-only lg:hidden'>首页</span>
              {isEditMode && (
                <span
                  className='pointer-events-none absolute -bottom-0.5 -right-0.5 inline-flex h-[12px] w-[12px] items-center justify-center rounded-full bg-amber-500 text-[9px] leading-none text-white ring-2 ring-white dark:ring-slate-900 md:h-[14px] md:w-[14px] md:text-[10px]'
                  aria-hidden
                >
                  ✎
                </span>
              )}
            </Link>
          </Tooltip>
          {primaryTabs.map((tab) => (
            <Tooltip key={tab.id} content={tab.label} className='border-none'>
              <Link
                href={tab.href}
                className={clsx(
                  getButtonClassName(navigatingTo === tab.href, isTabActive(tab.href)),
                  'gap-0 md:gap-1 lg:gap-2',
                  compactButtonSizing,
                  navigatingTo === tab.href && 'pointer-events-none opacity-80'
                )}
                aria-label={tab.label}
                onClick={() => {
                  if (navigatingTo === tab.href) return;
                  setNavigatingTo(tab.href);
                }}
                tabIndex={navigatingTo === tab.href ? -1 : 0}
                aria-disabled={navigatingTo === tab.href}
              >
                <Image
                  src={tab.iconSrc}
                  alt={tab.iconAlt}
                  width={64}
                  height={64}
                  className={tabIconClassName}
                />
                <span className='hidden md:inline'>{tab.label}</span>
                <span className='sr-only md:hidden'>{tab.label}</span>
              </Link>
            </Tooltip>
          ))}
          {!!overflowTabs.length && (
            <div className='relative'>
              <Tooltip content='更多分类' className='border-none'>
                <button
                  type='button'
                  aria-label='更多分类'
                  className={clsx(
                    getButtonClassName(false, overflowOpen),
                    'min-w-[44px] px-2 md:px-2.5 lg:px-3.5'
                  )}
                  onClick={() => {
                    setOverflowOpen((prev) => !prev);
                    setUserDropdownOpen(false);
                  }}
                >
                  ⋮
                </button>
              </Tooltip>
              {overflowOpen && (
                <div className='absolute right-0 mt-2 min-w-[160px] rounded-md bg-white shadow-lg dark:bg-slate-800 z-[9999]'>
                  <ul className='py-1'>
                    {overflowTabs.map((tab) => (
                      <li key={tab.id}>
                        <Link
                          href={tab.href}
                          className={clsx(
                            'flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700',
                            isTabActive(tab.href) && 'font-semibold'
                          )}
                          onClick={() => {
                            if (navigatingTo === tab.href) return;
                            setNavigatingTo(tab.href);
                            setOverflowOpen(false);
                          }}
                        >
                          <Image
                            src={tab.iconSrc}
                            alt={tab.iconAlt}
                            width={64}
                            height={64}
                            className='h-6 w-6 flex-shrink-0 object-contain'
                          />
                          <span>{tab.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right-aligned detailed/simple view toggle button, SearchBar, and User Settings */}
        <div className='flex items-center gap-1 md:gap-2 lg:gap-2.5'>
          {pathname === '/' || pathname === '' ? <SearchBar /> : <DarkModeToggleButton />}
          {showDetailToggle && (
            <Tooltip
              content={isDetailedView ? '切换至简明描述' : '切换至详细描述'}
              className='border-none'
            >
              <div
                className={clsx(
                  'relative flex min-h-[40px] cursor-pointer rounded-lg bg-gray-100 p-1 transition-all duration-200 dark:bg-slate-800 dark:border-gray-600 md:min-h-[44px]'
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
                    'relative z-10 flex items-center justify-center whitespace-nowrap px-2 py-1 text-xs font-medium transition-colors duration-200 md:py-1.5 md:text-sm lg:py-2',
                    !isDetailedView
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-500'
                  )}
                >
                  <span className='lg:hidden'>简</span>
                  <span className='hidden lg:inline'>简明</span>
                </div>

                {/* Detailed option */}
                <div
                  className={clsx(
                    'relative z-10 flex items-center justify-center whitespace-nowrap px-2 py-1 text-xs font-medium transition-colors duration-200 md:py-1.5 md:text-sm lg:py-2',
                    isDetailedView
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-500 dark:text-gray-500'
                  )}
                >
                  <span className='lg:hidden'>详</span>
                  <span className='hidden lg:inline'>详细</span>
                </div>
              </div>
            </Tooltip>
          )}
          {/* User Settings Dropdown (deferred until mounted to avoid hydration mismatch) */}
          {mounted && !!nickname && (
            <div className='relative'>
              <Tooltip content='用户设置' className='border-none'>
                <button
                  type='button'
                  aria-label='用户设置'
                  className={clsx(
                    getButtonClassName(false, userDropdownOpen),
                    'flex items-center justify-center p-2'
                  )}
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                >
                  <UserCircleIcon className='size-6' strokeWidth={1.5} />
                </button>
              </Tooltip>
              {userDropdownOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 shadow-lg rounded-md z-[99999]'>
                  <ul>
                    <li className='px-4 py-2 text-gray-800 dark:text-gray-200'>你好，{nickname}</li>
                    {(role == 'Coordinator' || role == 'Reviewer') && (
                      <li className='px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'>
                        <Link href='/admin/' className='block text-gray-800 dark:text-gray-200'>
                          进入管理面板
                        </Link>
                      </li>
                    )}
                    {!!signOutError && (
                      <li className='px-4 py-2 text-red-600 dark:text-red-400'>{signOutError}</li>
                    )}
                    <li>
                      <button
                        type='button'
                        className={clsx(
                          'w-full text-left px-4 py-2 cursor-pointer rounded-b-md text-gray-800 dark:text-gray-200',
                          signingOut
                            ? 'opacity-60 pointer-events-none bg-gray-100 dark:bg-slate-700'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                        )}
                        onClick={handleSignOut}
                        disabled={signingOut}
                      >
                        {signingOut ? '正在退出…' : '退出登录'}
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
