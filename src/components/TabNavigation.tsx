'use client';

import React, { useState, useEffect } from 'react';
import Image from '@/components/Image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './ui/SearchBar';
import Tooltip from './ui/Tooltip';
import { useAppContext } from '@/context/AppContext';
import { useMobile } from '@/hooks/useMediaQuery';
import clsx from 'clsx';
import { DarkModeToggleButton } from './ui/DarkModeToggleButton';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { useEditMode } from '@/context/EditModeContext';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import { UserCircleIcon } from '@/components/icons/CommonIcons';

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

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  // Ensure client-only UI matches server HTML on first paint
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const isMobile = useMobile();
  const { nickname, role, clearData: clearUserData } = useUser();
  const { isEditMode } = useEditMode();
  const { items, isActive } = useNavigationTabs();

  useEffect(() => {
    setMounted(true);
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
      setDropdownOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setSignOutError(msg);
    } finally {
      setSigningOut(false);
    }
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
            <Link
              href='/'
              className={clsx(
                getButtonClassName(isMobile, false, isHomeActive()),
                'relative',
                isMobile && 'min-w-[40px]',
                navigatingTo === '/' && 'pointer-events-none opacity-80'
              )}
              onClick={() => {
                if (navigatingTo === '/') return;
                setNavigatingTo('/');
              }}
              tabIndex={navigatingTo === '/' ? -1 : 0}
              aria-disabled={navigatingTo === '/'}
            >
              {!isMobile && '首页'}
              {isMobile && '🏠'}
              {isEditMode && (
                <span
                  className='pointer-events-none absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white dark:ring-slate-900'
                  style={{ width: isMobile ? 12 : 14, height: isMobile ? 12 : 14, fontSize: 9 }}
                  aria-hidden
                  title='编辑模式'
                >
                  ✎
                </span>
              )}
            </Link>
          </Tooltip>
          {items.map((tab) => (
            <Tooltip
              key={tab.id}
              content={tab.label}
              className='border-none'
              disabled={!isMobile}
              delay={800}
            >
              <Link
                href={tab.href}
                className={clsx(
                  getButtonClassName(isMobile, false, isTabActive(tab.href)),
                  isMobile ? 'gap-0' : 'gap-2',
                  navigatingTo === tab.href && 'pointer-events-none opacity-80'
                )}
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
                  className='object-contain'
                  style={{ height: isMobile ? '24px' : '28px', width: 'auto' }}
                />
                {!isMobile && <span>{tab.label}</span>}
              </Link>
            </Tooltip>
          ))}
        </div>

        {/* Right-aligned detailed/simple view toggle button, SearchBar, and User Settings */}
        <div className={clsx('flex items-center', isMobile ? 'gap-1' : 'gap-3')}>
          {pathname === '/' || pathname === '' ? <SearchBar /> : <DarkModeToggleButton />}
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
          {/* User Settings Dropdown (deferred until mounted to avoid hydration mismatch) */}
          {mounted && !!nickname && (
            <div className='relative'>
              <button
                type='button'
                aria-label='用户设置'
                title='用户设置'
                className={clsx(
                  getButtonClassName(isMobile, false, dropdownOpen),
                  'flex items-center justify-center p-2'
                )}
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <UserCircleIcon className='size-6' strokeWidth={1.5} />
              </button>
              {dropdownOpen && (
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
