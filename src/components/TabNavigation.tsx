'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

import { getActionsStorageKey, readActionHistory } from '@/lib/edit/diffUtils';
import { supabase } from '@/lib/supabase/client';
import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import { useUser } from '@/hooks/useUser';
import { useAppContext } from '@/context/AppContext';
import { useEditMode } from '@/context/EditModeContext';
import { useToast } from '@/context/ToastContext';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import { CheckBadgeIcon, TrashIcon, UserCircleIcon } from '@/components/icons/CommonIcons';
import Image from '@/components/Image';
import Link from '@/components/Link';

import { DarkModeToggleButton } from './ui/DarkModeToggleButton';
import SearchBar from './ui/SearchBar';
import Tooltip from './ui/Tooltip';

// Helper function for button styling
const getButtonClassName = (isNavigating: boolean, isActive: boolean) => {
  const baseClasses =
    'flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-md border-none px-2 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 focus-visible:dark:outline-blue-300 md:px-2.5 md:min-h-[44px] lg:px-3.5 lg:text-base';

  const stateClasses = isNavigating
    ? 'bg-gray-400 text-white cursor-not-allowed opacity-80 pointer-events-none'
    : isActive
      ? 'bg-blue-600 text-white dark:bg-blue-700'
      : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600';

  return clsx(baseClasses, stateClasses);
};

type TabNavigationProps = {
  showDetailToggle?: boolean;
};

const MOBILE_STACK_COLLAPSE_WIDTHS = [624, 580, 536, 492, 448, 404, 360, 316, 272, 228] as const;

const DESKTOP_STACK_COLLAPSE_WIDTHS = [9999, 1310, 1180, 1050, 764] as const;

const DETAIL_TOGGLE_WIDTH = 56;
const USER_BUTTON_WIDTH = 44;

export default function TabNavigation({ showDetailToggle = false }: TabNavigationProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [actionInfoOpen, setActionInfoOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [collapsedCount, setCollapsedCount] = useState(0);
  const [publishingActions, setPublishingActions] = useState(false);
  const pathname = usePathname();
  const { isDetailedView, toggleDetailedView } = useAppContext();
  const { nickname, role, clearData: clearUserData } = useUser();
  const { isEditMode, revokeLocalActions } = useEditMode();
  const { success, error: errorToast, info } = useToast();
  const { items, isActive } = useNavigationTabs();
  const isMobile = useMobile();

  const publishableEntityTypes = [
    'characters',
    'factions',
    'cards',
    'entities',
    'buffs',
    'items',
    'fixtures',
    'maps',
    'modes',
    'specialSkills',
  ] as const;

  const handlePublishActions = async () => {
    if (publishingActions) return;

    const enabled =
      !process.env.NEXT_PUBLIC_DISABLE_ARTICLES && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!enabled) {
      errorToast('当前环境未启用 Supabase，无法发布改动');
      return;
    }

    if (typeof window === 'undefined') return;

    const payloads = publishableEntityTypes
      .map((entityType) => {
        const storageKey = getActionsStorageKey(entityType);
        const entries = readActionHistory(storageKey);
        return { entityType, storageKey, entries };
      })
      .filter((p) => p.entries.length > 0);

    const totalEntries = payloads.reduce((sum, p) => sum + p.entries.length, 0);

    if (payloads.length === 0) {
      info('没有可发布的本地改动记录');
      return;
    }

    const confirmed = window.confirm(
      `将发布 ${payloads.length} 类数据的 ${totalEntries} 条改动记录。\n\n继续吗？`
    );

    if (!confirmed) return;

    setPublishingActions(true);
    try {
      for (const payload of payloads) {
        const res = await fetch('/api/game-data-actions/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: payload.entityType, entries: payload.entries }),
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || `发布失败（${payload.entityType}）`);
        }

        localStorage.removeItem(payload.storageKey);
      }

      success('改动已提交。若需公开，请等待审核/或由审核者批准。');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '发布失败';
      errorToast(msg);
    } finally {
      setPublishingActions(false);
    }
  };

  const clearLocalActionHistories = () => {
    if (typeof window === 'undefined') return;

    const payloads = publishableEntityTypes
      .map((entityType) => {
        const storageKey = getActionsStorageKey(entityType);
        const entries = readActionHistory(storageKey);
        return { entityType, storageKey, entries };
      })
      .filter((p) => p.entries.length > 0);

    const totalEntries = payloads.reduce((sum, p) => sum + p.entries.length, 0);

    if (payloads.length === 0) {
      info('没有本地改动记录可清空');
      return;
    }

    const confirmed = window.confirm(
      `将清空 ${payloads.length} 类数据的 ${totalEntries} 条本地改动记录。\n\n此操作不可撤销，继续吗？`
    );
    if (!confirmed) return;

    for (const payload of payloads) {
      if (isEditMode) {
        revokeLocalActions(payload.entityType);
      }
      window.localStorage.removeItem(payload.storageKey);
    }
    success('已清空本地改动记录');
  };

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
    setActionInfoOpen(false);
  }, [pathname, navigatingTo]);

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

  const totalTabs = items.length;
  const clampedCollapsed = Math.min(collapsedCount, totalTabs);
  const isCompactMode = clampedCollapsed > 0;
  const visibleCount = Math.max(totalTabs - clampedCollapsed, 0);
  const activeIndex = items.findIndex((tab) => isTabActive(tab.href));
  const sortedTabs = isCompactMode
    ? items
        .slice()
        .sort((a, b) => +(items.indexOf(a) < activeIndex) - +(items.indexOf(b) < activeIndex))
    : items;
  const primaryTabs = sortedTabs
    .slice(0, visibleCount)
    .filter(
      (tab) =>
        (!process.env.NEXT_PUBLIC_DISABLE_ARTICLES &&
          !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
        tab.id !== 'articles'
    );
  const overflowTabs = clampedCollapsed > 0 ? sortedTabs.slice(visibleCount) : [];

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
            <Link
              href='/'
              className={clsx(
                getButtonClassName(navigatingTo === '/', isHomeActive()),
                'relative',
                homeButtonSizing
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
                  className='pointer-events-none absolute -right-0.5 -bottom-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 text-[9px] leading-none text-white ring-2 ring-white md:h-3.5 md:w-3.5 md:text-[10px] dark:ring-slate-900'
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
                  tabMinWidthClass
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
                    tabMinWidthClass,
                    'px-2 md:px-2.5 lg:px-3.5'
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
                <div
                  className={clsx(
                    'absolute z-9999 mt-2 min-w-35 rounded-md bg-white shadow-lg dark:bg-slate-800',
                    dropdownAlignmentClass
                  )}
                >
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
                            className='h-6 w-6 shrink-0 object-contain'
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
            !process.env.NEXT_PUBLIC_DISABLE_ARTICLES &&
            !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
              <div className='relative' data-user-dropdown-root>
                <Tooltip content='用户设置' className='border-none'>
                  <button
                    type='button'
                    aria-label='用户设置'
                    className={clsx(getButtonClassName(false, userDropdownOpen), 'p-2')}
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                  >
                    <UserCircleIcon className='size-6' strokeWidth={1.5} />
                  </button>
                </Tooltip>
                {userDropdownOpen && (
                  <div
                    className={clsx(
                      'absolute right-0 z-99999 mt-2 rounded-md bg-white shadow-lg dark:bg-slate-800',
                      actionInfoOpen ? 'w-96' : 'w-48'
                    )}
                  >
                    <ul>
                      <li className='px-4 py-2 text-gray-800 dark:text-gray-200'>
                        你好，{nickname}
                      </li>
                      <li>
                        <button
                          type='button'
                          className={clsx(
                            'w-full cursor-pointer px-4 py-2 text-left text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700',
                            actionInfoOpen && 'font-semibold'
                          )}
                          onClick={() => setActionInfoOpen((prev) => !prev)}
                        >
                          改动记录
                        </button>
                      </li>
                      {actionInfoOpen && (
                        <li className='border-b border-gray-100 px-4 py-3 text-sm text-gray-800 dark:border-slate-700 dark:text-gray-200'>
                          {(() => {
                            if (typeof window === 'undefined') return null;

                            const payloads = publishableEntityTypes
                              .map((entityType) => {
                                const storageKey = getActionsStorageKey(entityType);
                                const entries = readActionHistory(storageKey);
                                return { entityType, storageKey, entries };
                              })
                              .filter((p) => p.entries.length > 0);

                            const totalEntries = payloads.reduce(
                              (sum, p) => sum + p.entries.length,
                              0
                            );

                            return (
                              <div className='space-y-2'>
                                <div className='flex items-center justify-between gap-2'>
                                  <div className='text-xs text-gray-600 dark:text-gray-400'>
                                    共 {payloads.length} 类 / {totalEntries} 条
                                    {isEditMode ? '（编辑模式中）' : ''}
                                  </div>
                                </div>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <button
                                    type='button'
                                    onClick={handlePublishActions}
                                    disabled={publishingActions || payloads.length === 0}
                                    className={clsx(
                                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                                      publishingActions || payloads.length === 0
                                        ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                                    )}
                                    aria-label='发布本地改动'
                                  >
                                    <CheckBadgeIcon size={16} strokeWidth={1.8} />
                                    发布
                                  </button>
                                  <button
                                    type='button'
                                    onClick={clearLocalActionHistories}
                                    disabled={payloads.length === 0}
                                    className={clsx(
                                      'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
                                      payloads.length === 0
                                        ? 'cursor-not-allowed bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
                                    )}
                                    aria-label='清空本地改动记录'
                                  >
                                    <TrashIcon size={16} strokeWidth={1.8} />
                                    清空
                                  </button>
                                </div>
                                {payloads.length === 0 ? (
                                  <div className='text-xs text-gray-600 dark:text-gray-400'>
                                    暂无本地改动记录。
                                  </div>
                                ) : (
                                  <div className='max-h-64 space-y-2 overflow-auto rounded-md bg-gray-50 p-2 text-xs dark:bg-slate-900'>
                                    {payloads.map((p) => (
                                      <details key={p.entityType} className='rounded-md'>
                                        <summary className='cursor-pointer font-medium select-none'>
                                          {p.entityType}（{p.entries.length}）
                                        </summary>
                                        <pre className='mt-2 text-[11px] wrap-break-word whitespace-pre-wrap text-gray-800 dark:text-gray-200'>
                                          {JSON.stringify(p.entries, null, 2)}
                                        </pre>
                                      </details>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </li>
                      )}
                      <li>
                        <button
                          type='button'
                          className='w-full cursor-pointer px-4 py-2 text-left text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setActionInfoOpen(false);
                            setChangePasswordOpen(true);
                          }}
                        >
                          修改密码
                        </button>
                      </li>
                      {(role == 'Coordinator' || role == 'Reviewer') && (
                        <li className='cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-700'>
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
                            'w-full cursor-pointer rounded-b-md px-4 py-2 text-left text-gray-800 dark:text-gray-200',
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
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {changePasswordOpen && <ChangePasswordDialog onClose={() => setChangePasswordOpen(false)} />}
    </div>
  );
}
