'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';

import { getNavigationButtonClasses } from '@/lib/design';
import { supabase } from '@/lib/supabase/client';
import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationProgress } from '@/hooks/useNavigationProgress';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import { useUser } from '@/hooks/useUser';
import { useAppContext } from '@/context/AppContext';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { HomeIcon, UserCircleIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { env } from '@/env';

import { DarkModeToggleButton } from './ui/DarkModeToggleButton';
import SearchBar from './ui/SearchBar';
import Tooltip from './ui/Tooltip';

const MotionLink = m.create(Link);

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

const MOBILE_STACK_COLLAPSE_WIDTHS = [724, 680, 636, 592, 548, 504, 460, 416, 372, 328] as const;

const DESKTOP_STACK_COLLAPSE_WIDTHS = [9999, 1410, 1280, 1150, 864] as const;

const DETAIL_TOGGLE_WIDTH = 56;
const USER_BUTTON_WIDTH = 44;

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [collapsedCount, setCollapsedCount] = useState(0);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { nickname, role, clearData: clearUserData } = useUser();
  const { items, isActive } = useNavigationTabs();
  const isMobile = useMobile();
  const shouldReduceMotion = useReducedMotion();
  const { isNavigatingTo } = useNavigationProgress();

  useEffect(() => {
    setMounted(true);
  }, []);

  const evaluateCollapsedCount = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const extraWidth =
      (showDetailToggle ? DETAIL_TOGGLE_WIDTH : 0) + (!!nickname ? USER_BUTTON_WIDTH : 0);
    const adjustedWidth = Math.max(width - extraWidth, 0);
    const total = items.length;
    let nextCollapsed = 0;

    const collapseWidths = isMobile ? MOBILE_STACK_COLLAPSE_WIDTHS : DESKTOP_STACK_COLLAPSE_WIDTHS;

    for (let index = 0; index < collapseWidths.length; index += 1) {
      const threshold = collapseWidths[index]!;
      if (adjustedWidth < threshold) {
        const collapseSize = Math.min(total, index + 2);
        nextCollapsed = Math.max(nextCollapsed, collapseSize);
      }
    }

    setCollapsedCount((prev) => (prev === nextCollapsed ? prev : nextCollapsed));
    if (nextCollapsed === 0) {
      setOverflowOpen((prev) => (prev ? false : prev));
    }
  }, [items, nickname, showDetailToggle, isMobile]);

  useEffect(() => {
    if (!mounted) return;
    evaluateCollapsedCount();
  }, [mounted, items, pathname, evaluateCollapsedCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => evaluateCollapsedCount();
    evaluateCollapsedCount();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [evaluateCollapsedCount]);

  // Reset overlay states when pathname changes
  useEffect(() => {
    setOverflowOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (!userDropdownOpen) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-user-dropdown-root]')) return;
      setUserDropdownOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [mounted, userDropdownOpen]);

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
      console.log('User signed out successfully');
      clearUserData();
      setUserDropdownOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误';
      setSignOutError(msg);
    } finally {
      setSigningOut(false);
    }
  };

  const isArticlesEnabled =
    env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const renderItems = items.filter((tab) => isArticlesEnabled || tab.id !== 'articles');

  const totalTabs = renderItems.length;
  const clampedCollapsed = Math.min(collapsedCount, totalTabs);
  const isCompactMode = clampedCollapsed > 0;
  const visibleCount = Math.max(totalTabs - clampedCollapsed, 0);
  const activeIndex = renderItems.findIndex((tab) => isTabActive(tab.href));

  // Sliding window logic: preserve order, but shift window if active tab is hidden
  let startIndex = 0;
  if (activeIndex >= visibleCount) {
    startIndex = activeIndex - visibleCount + 1;
  }

  const primaryTabs = renderItems.slice(startIndex, startIndex + visibleCount);
  const overflowTabs = [
    ...renderItems.slice(0, startIndex),
    ...renderItems.slice(startIndex + visibleCount),
  ];

  const tabMinWidthClass = 'min-w-[40px]';
  const homeButtonSizing = clsx('min-w-[40px]', !isCompactMode && 'lg:min-w-fit');
  const tabIconClassName = clsx(
    'h-6 object-contain md:h-7',
    isCompactMode ? 'w-6 flex-shrink-0 md:w-7' : 'w-auto'
  );
  const shouldAlignLeft = showDetailToggle || !!nickname;
  const dropdownAlignmentClass = shouldAlignLeft ? 'left-0' : 'right-0';
  const shouldDisplayUserSettings =
    pathname === '/' || pathname === '' || pathname.startsWith('/articles');

  return (
    <div className='fixed top-0 right-0 left-0 z-50 w-full bg-white py-2 shadow-md dark:bg-slate-900 dark:shadow-lg'>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-4 px-4'>
        {/* Left-aligned navigation buttons */}
        <div className={clsx('relative flex flex-nowrap gap-1 md:gap-2 lg:gap-2.5')}>
          <Tooltip content='首页' className='border-none'>
            <MotionLink
              href='/'
              className={clsx(
                getNavigationButtonClasses(isNavigatingTo('/'), isHomeActive(), false, true),
                'relative',
                homeButtonSizing
              )}
              aria-label='首页'
              tabIndex={isNavigatingTo('/') ? -1 : 0}
              aria-disabled={isNavigatingTo('/')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isHomeActive() && (
                <m.div
                  layoutId='active-nav-pill'
                  className='absolute inset-0 -z-10 rounded-md bg-blue-600 dark:bg-blue-700'
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <HomeIcon className='size-6 lg:hidden' />
              <span className='hidden lg:inline'>首页</span>
              <span className='sr-only lg:hidden'>首页</span>
            </MotionLink>
          </Tooltip>
          {primaryTabs.map((tab) => (
            <Tooltip key={tab.id} content={tab.label} className='border-none'>
              <MotionLink
                href={tab.href}
                className={clsx(
                  getNavigationButtonClasses(
                    isNavigatingTo(tab.href),
                    isTabActive(tab.href),
                    false,
                    true
                  ),
                  'gap-0 md:gap-1 lg:gap-2',
                  tabMinWidthClass
                )}
                aria-label={tab.label}
                tabIndex={isNavigatingTo(tab.href) ? -1 : 0}
                aria-disabled={isNavigatingTo(tab.href)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isTabActive(tab.href) && (
                  <m.div
                    layoutId='active-nav-pill'
                    className='absolute inset-0 -z-10 rounded-md bg-blue-600 dark:bg-blue-700'
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Image
                  src={tab.iconSrc}
                  alt={tab.iconAlt}
                  width={64}
                  height={64}
                  className={tabIconClassName}
                />
                <span className='hidden md:inline'>{tab.label}</span>
                <span className='sr-only md:hidden'>{tab.label}</span>
              </MotionLink>
            </Tooltip>
          ))}
          {!!overflowTabs.length && (
            <div className='relative'>
              <m.button
                type='button'
                aria-label='更多分类'
                className={getNavigationButtonClasses(false, overflowOpen, true)}
                onClick={() => {
                  setOverflowOpen((prev) => !prev);
                  setUserDropdownOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ⋮
              </m.button>
              <AnimatePresence initial={false}>
                {overflowOpen && (
                  <m.div
                    key='tab-overflow-menu'
                    className={clsx(
                      'absolute z-9999 mt-2 min-w-35 rounded-md bg-white shadow-lg dark:bg-slate-800',
                      dropdownAlignmentClass
                    )}
                    initial={
                      shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    style={{ transformOrigin: 'top' }}
                  >
                    <ul className='py-1'>
                      {overflowTabs.map((tab) => (
                        <li key={tab.id}>
                          <Link
                            href={tab.href}
                            className={clsx(
                              'flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700',
                              isTabActive(tab.href) && 'font-semibold'
                            )}
                            onClick={() => {
                              setOverflowOpen(false);
                            }}
                          >
                            <Image
                              src={tab.iconSrc}
                              alt={tab.iconAlt}
                              width={64}
                              height={64}
                              className='h-6 w-6 shrink-0 object-contain'
                            />
                            <span>{tab.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Right-aligned detailed/simple view toggle button, SearchBar, and User Settings */}
        <div className='flex items-center gap-1 md:gap-2 lg:gap-2.5'>
          {pathname === '/' || pathname === '' ? (
            <>
              <SearchBar />
              <DarkModeToggleButton />
            </>
          ) : (
            <DarkModeToggleButton />
          )}
          {showDetailToggle && (
            <Tooltip
              content={isDetailedView ? '切换至简明描述' : '切换至详细描述'}
              className='border-none'
            >
              <div
                className={clsx(
                  'relative flex min-h-10 cursor-pointer rounded-lg bg-gray-100 p-1 transition-all duration-200 md:min-h-11 dark:border-gray-600 dark:bg-slate-800'
                )}
                onClick={toggleDetailedView}
              >
                {/* Background slider */}
                <div
                  className={clsx(
                    'absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md shadow-sm transition-all duration-200 ease-out',
                    isDetailedView
                      ? 'left-1 translate-x-full transform bg-orange-100 dark:bg-orange-900'
                      : 'left-1 translate-x-0 transform bg-blue-100 dark:bg-blue-900'
                  )}
                />

                {/* Simple option */}
                <div
                  className={clsx(
                    'relative z-10 flex items-center justify-center px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200 md:py-1.5 md:text-sm lg:py-2',
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
                    'relative z-10 flex items-center justify-center px-2 py-1 text-xs font-medium whitespace-nowrap transition-colors duration-200 md:py-1.5 md:text-sm lg:py-2',
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
          {mounted &&
            !!nickname &&
            shouldDisplayUserSettings &&
            env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' &&
            !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
              <div className='relative' data-user-dropdown-root>
                <Tooltip content='用户设置' className='border-none'>
                  <m.button
                    type='button'
                    aria-label='用户设置'
                    className={getNavigationButtonClasses(false, userDropdownOpen, true)}
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <UserCircleIcon className='size-6' strokeWidth={1.5} />
                  </m.button>
                </Tooltip>
                <AnimatePresence initial={false}>
                  {userDropdownOpen && (
                    <m.div
                      key='user-settings-dropdown'
                      className='absolute right-0 z-99999 mt-2 w-48 rounded-md bg-white shadow-lg dark:bg-slate-800'
                      initial={
                        shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }
                      }
                      transition={{ duration: 0.14, ease: 'easeOut' }}
                      style={{ transformOrigin: 'top right' }}
                    >
                      <ul className='py-1'>
                        <li className='px-4 py-2 text-sm text-gray-800 dark:text-gray-200'>
                          你好，{nickname}
                        </li>
                        <li>
                          <button
                            type='button'
                            className='w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                            onClick={() => {
                              setUserDropdownOpen(false);
                              setChangePasswordOpen(true);
                            }}
                          >
                            修改密码
                          </button>
                        </li>
                        {(role == 'Coordinator' || role == 'Reviewer') && (
                          <li>
                            <Link
                              href='/admin/'
                              className='block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                            >
                              进入管理面板
                            </Link>
                          </li>
                        )}
                        {!!signOutError && (
                          <li className='px-4 py-2 text-sm text-red-600 dark:text-red-400'>
                            {signOutError}
                          </li>
                        )}
                        <li>
                          <button
                            type='button'
                            className={clsx(
                              'w-full cursor-pointer rounded-b-md px-4 py-2 text-left text-sm text-gray-800 dark:text-gray-200',
                              signingOut
                                ? 'pointer-events-none bg-gray-100 opacity-60 dark:bg-slate-700'
                                : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                            )}
                            onClick={handleSignOut}
                            disabled={signingOut}
                          >
                            {signingOut ? '正在退出…' : '退出登录'}
                          </button>
                        </li>
                      </ul>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {changePasswordOpen && (
          <ChangePasswordDialog onClose={() => setChangePasswordOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
