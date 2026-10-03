'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/design';
import { DocPage } from '@/features/articles/utils/docs';
import { BaseDialog } from '@/components/ui/BaseDialog';
import Button from '@/components/ui/Button';
import {
  ArchiveBoxIcon,
  Bars3Icon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  DocumentTextIcon,
} from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

type DocsSidebarProps = {
  docPages: DocPage[];
};

export default function DocsSidebar({ docPages }: DocsSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setIsOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const renderSidebarContent = (collapsed: boolean) => (
    <div className='flex h-full flex-col'>
      {/* Header */}
      <div className='border-border relative border-b p-4'>
        <Button
          variant='ghost'
          size='sm'
          className='absolute top-2 right-2 size-11 p-2 lg:hidden'
          onClick={() => setIsOpen(false)}
          aria-label='关闭文档导航'
        >
          <CloseIcon className='size-5' />
        </Button>
        {!collapsed && (
          <>
            <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>文档</h2>
            {/* <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>这里是杂项文档</p> */}
          </>
        )}

        {/* Desktop collapse button */}
        <Button
          variant='unstyled'
          onClick={toggleCollapse}
          className={cn(
            'absolute top-4 right-4 hidden rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 lg:flex dark:hover:text-gray-300',
            collapsed && 'right-auto left-4'
          )}
          aria-label={collapsed ? '展开文档导航' : '收起文档导航'}
        >
          {collapsed ? (
            <ChevronRightIcon className='h-4 w-4' />
          ) : (
            <ChevronLeftIcon className='h-4 w-4' />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-2'>
          {/* Home link */}
          <Link
            href='/docs'
            className={cn(
              'flex min-h-11 items-center rounded-lg text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
              pathname === '/docs'
                ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                : 'text-foreground hover:bg-control'
            )}
            onClick={() => setIsOpen(false)}
            title={collapsed ? '文档首页' : undefined}
          >
            <ArchiveBoxIcon className={cn('h-4 w-4 shrink-0', !collapsed && 'mr-3')} />
            {!collapsed && <span>首页</span>}
          </Link>

          {/* Doc pages */}
          {docPages.length > 0 && (
            <div className='pt-4'>
              {!collapsed && (
                <h3 className='mb-2 px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                  文档列表
                </h3>
              )}
              <div className='space-y-1'>
                {docPages.map((page) => {
                  const isActive = pathname === page.path;
                  return (
                    <Link
                      key={page.slug}
                      href={page.path}
                      className={cn(
                        'flex min-h-11 items-center rounded-lg text-sm font-medium transition-colors',
                        collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                        isActive
                          ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'text-foreground hover:bg-control'
                      )}
                      onClick={() => setIsOpen(false)}
                      title={collapsed ? page.title : undefined}
                    >
                      <DocumentTextIcon className={cn('h-4 w-4 shrink-0', !collapsed && 'mr-3')} />
                      {!collapsed && <span className='truncate'>{page.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className='border-border border-t p-4'>
          <div className='space-y-1 text-xs text-gray-500 dark:text-gray-400'>
            <p className='flex items-center'>
              <CheckCircleIcon className='mr-1 h-3 w-3' />
              {docPages.length}个页面
            </p>
            <p>页面由文档自动生成。</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Button
        variant='secondary'
        size='sm'
        onClick={() => setIsOpen(true)}
        className='mb-4 lg:hidden'
        aria-label='打开文档导航'
        aria-expanded={isOpen}
        aria-haspopup='dialog'
        leadingIcon={<Bars3Icon className='size-5' />}
      >
        文档导航
      </Button>
      <aside
        className={cn(
          'border-border bg-surface text-foreground hidden shrink-0 border-r lg:block',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {renderSidebarContent(isCollapsed)}
      </aside>
      <BaseDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        ariaLabel='文档导航'
        panelClassName='inset-y-0 left-0 right-auto h-dvh w-80 max-w-[calc(100vw-2rem)] rounded-none md:inset-y-0 md:top-0 md:left-0 md:max-h-none md:translate-x-0 md:translate-y-0 md:transform-none'
      >
        {renderSidebarContent(false)}
      </BaseDialog>
    </>
  );
}
