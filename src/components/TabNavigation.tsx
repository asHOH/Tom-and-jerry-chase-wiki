'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useMediaQuery } from 'usehooks-ts';

import { getNavigationButtonClasses } from '@/lib/design';
import { supabase } from '@/lib/supabase/client';
import { useFeatureDiscovery } from '@/hooks/useFeatureDiscovery';
import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationProgress } from '@/hooks/useNavigationProgress';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import { useUser } from '@/hooks/useUser';
import { useAppContext } from '@/context/AppContext';
import { isNavGroup } from '@/constants/navigation';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { HomeIcon, UserCircleIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';
import { env } from '@/env';

import AttentionDot from './ui/AttentionDot';
import { DarkModeToggleButton } from './ui/DarkModeToggleButton';
import SearchBar from './ui/SearchBar';
import Tooltip from './ui/Tooltip';

const MotionLink = m.create(Link);

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

const MOBILE_STACK_COLLAPSE_WIDTHS = [420, 376, 332] as const;

const DESKTOP_STACK_COLLAPSE_WIDTHS = [800, 720] as const;

const DETAIL_TOGGLE_WIDTH = 56;
const USER_BUTTON_WIDTH = 44;

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [collapsedCount, setCollapsedCount] = useState(0);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { nickname, role, clearData: clearUserData } = useUser();
  const { items, isActive } = useNavigationTabs();
  const isMobile = useMobile();
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const shouldReduceMotion = useReducedMotion();
  const { isNavigatingTo } = useNavigationProgress();
  const { shouldPrompt: showToggleHint, dismiss: dismissToggleHint } =
    useFeatureDiscovery('detail_toggle');

  useEffect(() => {
    setMounted(true);
  }, []);

  const evaluateCollapsedCount = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const extraWidth =
      (showDetailToggle ? DETAIL_TOGGLE_WIDTH : 0) + (nickname ? USER_BUTTON_WIDTH : 0);
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
    let rafId = 0;
    const handleResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(evaluateCollapsedCount);
    };
    evaluateCollapsedCount();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [evaluateCollapsedCount]);

  // Reset overlay states when pathname changes
  useEffect(() => {
    setOverflowOpen(false);
    setUserDropdownOpen(false);
    setOpenGroupId(null);
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

  useEffect(() => {
    if (!mounted) return;
    if (!overflowOpen) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-overflow-root]')) return;
      setOverflowOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [mounted, overflowOpen]);

  useEffect(() => {
    if (!mounted) return;
    if (!openGroupId) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('[data-group-dropdown-root]')) return;
      setOpenGroupId(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [mounted, openGroupId]);

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

  const totalTabs = items.length;
  const clampedCollapsed = Math.min(collapsedCount, totalTabs);
  const isCompactMode = clampedCollapsed > 0;
  const visibleCount = Math.max(totalTabs - clampedCollapsed, 0);
  const activeIndex = items.findIndex((entry) => {
    if (isNavGroup(entry)) return entry.children.some((child) => isTabActive(child.href));
    return isTabActive(entry.href);
  });

  // Sliding window logic: preserve order, but shift window if active tab is hidden
  let startIndex = 0;
  if (activeIndex >= visibleCount) {
    startIndex = activeIndex - visibleCount + 1;
  }

  const primaryTabs = items.slice(startIndex, startIndex + visibleCount);
  const overflowTabs = [...items.slice(0, startIndex), ...items.slice(startIndex + visibleCount)];

  const tabMinWidthClass = 'min-w-[40px]';
  const homeButtonSizing = clsx('min-w-[40px]', !isCompactMode && 'lg:min-w-fit');
  const tabIconWrapperClassName = clsx(
    'flex size-6 items-center justify-center overflow-hidden md:size-7',
    isCompactMode && 'shrink-0'
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
          <Tooltip content='首页' className='border-none' disabled={isLg}>
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
          {primaryTabs.map((entry) => {
            if (isNavGroup(entry)) {
              const isGroupActive = entry.children.some((child) => isTabActive(child.href));
              const isGroupOpen = openGroupId === entry.id;
              const image =
                entry.children.find((child) => isTabActive(child.href)) || entry.children[0];
              return (
                <div key={entry.id} className='relative' data-group-dropdown-root>
                  <Tooltip content={entry.label} className='border-none' disabled={isMd}>
                    <m.button
                      type='button'
                      aria-label={entry.label}
                      aria-expanded={isGroupOpen}
                      aria-haspopup='true'
                      className={clsx(
                        getNavigationButtonClasses(false, isGroupActive || isGroupOpen, false),
                        'gap-0 md:gap-1 lg:gap-2',
                        tabMinWidthClass
                      )}
                      onClick={() => {
                        setOpenGroupId((prev) => (prev === entry.id ? null : entry.id));
                        setOverflowOpen(false);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {!!image && (
                        <Image
                          src={image.iconSrc}
                          alt={image.iconAlt}
                          width={64}
                          height={64}
                          className='h-6 w-6 shrink-0 object-contain'
                        />
                      )}
                      <span className='hidden md:inline'>{entry.label}</span>
                      <span className='sr-only md:hidden'>{entry.label}</span>
                    </m.button>
                  </Tooltip>
                  <AnimatePresence initial={false}>
                    {isGroupOpen && (
                      <m.div
                        key={`group-${entry.id}-dropdown`}
                        className={clsx(
                          'absolute z-9999 mt-2 min-w-35 rounded-md bg-white shadow-lg dark:bg-slate-800',
                          dropdownAlignmentClass
                        )}
                        initial={
                          shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6, scale: 0.98 }
                        }
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={
                          shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }
                        }
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        style={{ transformOrigin: 'top' }}
                      >
                        <ul className='py-1'>
                          {entry.children.map(
                            (child) =>
                              (env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' ||
                                child.id != 'articles') && (
                                <li key={child.id}>
                                  <Link
                                    href={child.href}
                                    className={clsx(
                                      'flex items-center gap-2 px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700',
                                      isTabActive(child.href) && 'font-semibold'
                                    )}
                                    onClick={() => setOpenGroupId(null)}
                                  >
                                    <Image
                                      src={child.iconSrc}
                                      alt={child.iconAlt}
                                      width={64}
                                      height={64}
                                      className='h-6 w-6 shrink-0 object-contain'
                                    />
                                    <span>{child.label}</span>
                                  </Link>
                                </li>
                              )
                          )}
                        </ul>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            const tab = entry;
            return (
              <Tooltip key={tab.id} content={tab.label} className='border-none' disabled={isMd}>
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
                  <span className={tabIconWrapperClassName}>
                    <Image
                      src={tab.iconSrc}
                      alt={tab.iconAlt}
                      width={64}
                      height={64}
                      className='h-full w-full object-contain'
                    />
                  </span>
                  <span className='hidden md:inline'>{tab.label}</span>
                  <span className='sr-only md:hidden'>{tab.label}</span>
                </MotionLink>
              </Tooltip>
            );
          })}
          {!!overflowTabs.length && (
            <div className='relative' data-overflow-root>
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
                      {overflowTabs.map((entry) => {
                        if (isNavGroup(entry)) {
                          return (
                            <li key={entry.id}>
                              <div className='px-4 py-1 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                                {entry.label}
                              </div>
                              {entry.children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={child.href}
                                  className={clsx(
                                    'flex items-center gap-2 py-2 pr-4 pl-7 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700',
                                    isTabActive(child.href) && 'font-semibold'
                                  )}
                                  onClick={() => setOverflowOpen(false)}
                                >
                                  <Image
                                    src={child.iconSrc}
                                    alt={child.iconAlt}
                                    width={64}
                                    height={64}
                                    className='h-6 w-6 shrink-0 object-contain'
                                  />
                                  <span>{child.label}</span>
                                </Link>
                              ))}
                            </li>
                          );
                        }
                        const tab = entry;
                        return (
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
                        );
                      })}
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
                onClick={() => {
                  toggleDetailedView();
                  if (showToggleHint) dismissToggleHint();
                }}
              >
                <AttentionDot
                  visible={showToggleHint && showDetailToggle}
                  color={isDetailedView ? 'orange' : 'blue'}
                  className='-top-1 -right-1'
                />
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
