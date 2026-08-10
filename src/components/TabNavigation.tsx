'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { usePathname } from 'next/navigation';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { useMediaQuery } from 'usehooks-ts';

import { usePermissions } from '@/lib/auth/PermissionProvider';
import type { PermissionKey } from '@/lib/auth/permissions';
import type { BlockAction, BlockedUserSummary } from '@/lib/blocks/types';
import { cn, getNavigationButtonClasses } from '@/lib/design';
import { getOptionalSupabaseBrowserClient } from '@/lib/supabase/browserClient';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { getUserProfileHref } from '@/lib/users/profileRoutes';
import { useMobile } from '@/hooks/useMediaQuery';
import { useNavigationProgress } from '@/hooks/useNavigationProgress';
import { useNavigationTabs } from '@/hooks/useNavigationTabs';
import { useNotificationCount } from '@/hooks/useNotificationCount';
import { useUser } from '@/hooks/useUser';
import { isNavGroup, NavEntry, NavItem } from '@/constants/navigation';
import Button from '@/components/ui/Button';
import MotionButton from '@/components/ui/MotionButton';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';
import DetailViewToggle from '@/components/DetailViewToggle';
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

const MOBILE_STACK_COLLAPSE_WIDTHS = [420, 376, 332] as const;

const DETAIL_TOGGLE_WIDTH = 56;
const USER_BUTTON_WIDTH = 44;
const dropdownMenuIconClassName = '!h-6 !w-6 shrink-0 object-contain';
const dropdownMenuLinkBaseClassName =
  'flex min-h-10 items-center gap-2 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700';

type DropdownNavLinkProps = {
  item: NavItem;
  isActive: boolean;
  paddingClassName: string;
  onClick(): void;
};

const shouldShowNavItem = (item: NavItem) =>
  env.NEXT_PUBLIC_DISABLE_ARTICLES !== '1' || item.id !== 'articles';

const BLOCK_ACTION_LABELS: Record<BlockAction, string> = {
  edit: '编辑',
  upload: '上传',
  create_account: '创建账号',
  email: '邮件',
};

const formatBlockExpiry = (expiresAt: string | null) =>
  expiresAt
    ? `至 ${new Date(expiresAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`
    : '永久';

function DropdownNavLink({ item, isActive, paddingClassName, onClick }: DropdownNavLinkProps) {
  return (
    <Link
      href={item.href}
      className={cn(dropdownMenuLinkBaseClassName, paddingClassName, isActive && 'font-semibold')}
      onClick={onClick}
    >
      <Image
        src={item.iconSrc}
        alt={item.iconAlt}
        width={64}
        height={64}
        className={dropdownMenuIconClassName}
      />
      <span>{item.label}</span>
    </Link>
  );
}

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
  const { nickname, blockSummary, clearData: clearUserData } = useUser();
  const hasEditBlock = blockSummary.some((block) => block.action === 'edit');
  const hasActiveBlock = blockSummary.length > 0;
  const permissions = usePermissions();
  const adminPermissions: PermissionKey[] = [
    'article_version.approve',
    'category.create',
    'category.update',
    'category.delete',
    'game_data_action.approve',
    'game_data_action.reject',
    'game_data_action.mark_synced',
    'game_data_action.revoke',
    'user.read',
    'user.update',
    'group.manage',
    'group.assign',
    'notice.manage',
  ];
  const canAccessAdmin =
    permissions.has('block.view') ||
    permissions.has('block.manage') ||
    (!hasEditBlock && adminPermissions.some(permissions.has));
  const unreadNotificationCount = useNotificationCount(!!nickname);
  const hasUnreadNotifications = unreadNotificationCount > 0;
  const unreadNotificationBadgeLabel =
    unreadNotificationCount > 99 ? '99+' : unreadNotificationCount.toString();
  const userSettingsLabel = hasActiveBlock
    ? hasUnreadNotifications
      ? `用户设置（账号受限，${unreadNotificationCount} 条未读通知）`
      : '用户设置（账号受限）'
    : hasUnreadNotifications
      ? `用户设置（${unreadNotificationCount} 条未读通知）`
      : '用户设置';
  const { items: rawItems, isActive } = useNavigationTabs();
  const isMobile = useMobile();
  const isMd = useMediaQuery('(min-width: 768px)', { initializeWithValue: false });
  const isLg = useMediaQuery('(min-width: 1024px)', { initializeWithValue: false });
  const shouldReduceMotion = useReducedMotion();
  const { isNavigatingTo } = useNavigationProgress();
  const items = useMemo(
    () => rawItems.flatMap<NavEntry>((entry) => (entry.shouldExpand ? entry.children : entry)),
    [rawItems]
  );
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

    const collapseWidths = isMobile ? MOBILE_STACK_COLLAPSE_WIDTHS : [];

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
      const supabase = getOptionalSupabaseBrowserClient();
      if (!supabase) {
        setSignOutError('登录服务未配置');
        return;
      }
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

  const tabMinWidthClass = 'min-w-10';
  const tabButtonClassName =
    'h-10 min-h-0 px-1 md:h-11 md:gap-1 md:px-2 md:text-base lg:text-[17px]';
  const tabIconWrapperClassName = cn(
    'flex size-7 items-center justify-center overflow-hidden md:size-8',
    isCompactMode && 'shrink-0'
  );
  const shouldAlignLeft = showDetailToggle || !!nickname;
  const dropdownAlignmentClass = shouldAlignLeft ? 'left-0' : 'right-0';
  return (
    <div className='bg-surface-raised fixed top-0 right-0 left-0 z-50 w-full py-2 shadow-md dark:shadow-lg'>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-1 px-2 sm:gap-4 sm:px-4'>
        {/* Left-aligned navigation buttons */}
        <div className={cn('relative flex flex-nowrap gap-1 md:gap-2 lg:gap-2.5')}>
          <Tooltip content='首页' className='border-none' disabled={isLg}>
            <MotionLink
              href='/'
              className={cn(
                getNavigationButtonClasses(isNavigatingTo('/'), isHomeActive(), false, true),
                'relative',
                tabMinWidthClass
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
              <HomeIcon className='size-6' />
              <span className='sr-only'>首页</span>
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
                    <MotionButton
                      variant='unstyled'
                      type='button'
                      aria-label={entry.label}
                      aria-expanded={isGroupOpen}
                      aria-haspopup='true'
                      className={cn(
                        getNavigationButtonClasses(false, isGroupActive || isGroupOpen, false),
                        tabButtonClassName,
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
                          src={entry.iconSrc || image.iconSrc}
                          alt={entry.iconAlt ?? image.iconAlt}
                          width={64}
                          height={64}
                          className='h-7 w-7 shrink-0 object-contain md:h-8 md:w-8'
                        />
                      )}
                      <span className='hidden md:inline'>{entry.label}</span>
                      <span className='sr-only md:hidden'>{entry.label}</span>
                    </MotionButton>
                  </Tooltip>
                  <AnimatePresence initial={false}>
                    {isGroupOpen && (
                      <m.div
                        key={`group-${entry.id}-dropdown`}
                        className={cn(
                          'bg-surface-raised absolute z-9999 mt-2 min-w-35 rounded-md shadow-lg',
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
                          {entry.children.filter(shouldShowNavItem).map((child) => (
                            <li key={child.id}>
                              <DropdownNavLink
                                item={child}
                                isActive={isTabActive(child.href)}
                                paddingClassName='px-4'
                                onClick={() => setOpenGroupId(null)}
                              />
                            </li>
                          ))}
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
                  className={cn(
                    getNavigationButtonClasses(
                      isNavigatingTo(tab.href),
                      isTabActive(tab.href),
                      false,
                      true
                    ),
                    tabButtonClassName,
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
              <MotionButton
                variant='unstyled'
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
              </MotionButton>
              <AnimatePresence initial={false}>
                {overflowOpen && (
                  <m.div
                    key='tab-overflow-menu'
                    className={cn(
                      'bg-surface-raised absolute z-9999 mt-2 min-w-35 rounded-md shadow-lg',
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
                              {entry.children.filter(shouldShowNavItem).map((child) => (
                                <DropdownNavLink
                                  key={child.id}
                                  item={child}
                                  isActive={isTabActive(child.href)}
                                  paddingClassName='pr-4 pl-7'
                                  onClick={() => setOverflowOpen(false)}
                                />
                              ))}
                            </li>
                          );
                        }
                        const tab = entry;
                        return (
                          <li key={tab.id}>
                            <DropdownNavLink
                              item={tab}
                              isActive={isTabActive(tab.href)}
                              paddingClassName='px-4'
                              onClick={() => setOverflowOpen(false)}
                            />
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
          <SearchBar />
          <DarkModeToggleButton />
          {showDetailToggle ? <DetailViewToggle /> : null}
          {/* User Settings Dropdown (deferred until mounted to avoid hydration mismatch) */}
          {mounted && !!nickname && hasSupabasePublicConfig() && (
            <div className='relative' data-user-dropdown-root>
              <Tooltip
                content={hasActiveBlock ? '账号受限：点击查看详情' : '用户设置'}
                className='border-none'
              >
                <MotionButton
                  variant='unstyled'
                  type='button'
                  aria-label={userSettingsLabel}
                  className={cn(
                    getNavigationButtonClasses(false, userDropdownOpen, true),
                    hasActiveBlock &&
                      'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/70 dark:bg-amber-950/40 dark:text-amber-300'
                  )}
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {hasUnreadNotifications && (
                    <span
                      aria-hidden='true'
                      className='absolute -top-1 -right-1 z-10 flex min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] leading-none font-semibold text-white ring-2 ring-white dark:ring-slate-800'
                    >
                      {unreadNotificationBadgeLabel}
                    </span>
                  )}
                  <span className='relative'>
                    <UserCircleIcon className='size-6' strokeWidth={1.5} />
                    {hasActiveBlock && (
                      <span
                        aria-hidden='true'
                        className='absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full bg-amber-500 text-[10px] leading-none font-bold text-white'
                      >
                        !
                      </span>
                    )}
                  </span>
                </MotionButton>
              </Tooltip>
              <AnimatePresence initial={false}>
                {userDropdownOpen && (
                  <m.div
                    key='user-settings-dropdown'
                    className='bg-surface-raised absolute right-0 z-99999 mt-2 w-64 rounded-md shadow-lg'
                    initial={
                      shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    style={{ transformOrigin: 'top right' }}
                  >
                    <ul className='py-1'>
                      {hasActiveBlock && (
                        <li
                          role='status'
                          className='mx-2 mb-1 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                        >
                          <div className='font-semibold'>账号受限</div>
                          <ul className='mt-1 space-y-1'>
                            {blockSummary.map((block: BlockedUserSummary) => (
                              <li key={`${block.blockId}:${block.action}`}>
                                {BLOCK_ACTION_LABELS[block.action]}：{block.reason}（
                                {formatBlockExpiry(block.expiresAt)}）
                              </li>
                            ))}
                          </ul>
                        </li>
                      )}
                      <li className='px-4 py-2 text-sm text-gray-800 dark:text-gray-200'>
                        你好，{nickname}
                      </li>
                      <li>
                        <Link
                          href={getUserProfileHref(nickname, { tab: 'activity' }) as Route}
                          className='block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                        >
                          个人主页
                        </Link>
                      </li>
                      <li>
                        <Link
                          href={getUserProfileHref(nickname, { tab: 'submissions' }) as Route}
                          className='block px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                        >
                          我的贡献
                        </Link>
                      </li>
                      <li>
                        <Link
                          href='/notifications/'
                          className='flex items-center justify-between px-4 py-2 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                        >
                          <span>通知</span>
                          {unreadNotificationCount > 0 && (
                            <span className='rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white'>
                              {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                            </span>
                          )}
                        </Link>
                      </li>
                      <li>
                        <Button
                          variant='unstyled'
                          type='button'
                          className='w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-slate-700'
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setChangePasswordOpen(true);
                          }}
                        >
                          修改密码
                        </Button>
                      </li>
                      {canAccessAdmin && (
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
                        <Button
                          variant='unstyled'
                          type='button'
                          className={cn(
                            'w-full cursor-pointer rounded-b-md px-4 py-2 text-left text-sm text-gray-800 dark:text-gray-200',
                            signingOut
                              ? 'pointer-events-none bg-gray-100 opacity-60 dark:bg-slate-700'
                              : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                          )}
                          onClick={handleSignOut}
                          disabled={signingOut}
                        >
                          {signingOut ? '正在退出…' : '退出登录'}
                        </Button>
                      </li>
                    </ul>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />
    </div>
  );
}
