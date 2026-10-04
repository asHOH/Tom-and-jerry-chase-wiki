'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/design';
import { DocPage } from '@/features/articles/utils/docs';
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

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant='unstyled'
        onClick={toggleSidebar}
        className='border-border bg-surface-raised text-foreground fixed top-4 left-4 z-50 rounded-md border p-2 shadow-md lg:hidden'
        aria-label='Toggle sidebar'
      >
        {isOpen ? (
          <CloseIcon className='h-6 w-6 text-gray-600 dark:text-gray-300' />
        ) : (
          <Bars3Icon className='h-6 w-6 text-gray-600 dark:text-gray-300' />
        )}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className='bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden'
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'border-border bg-surface text-foreground fixed inset-y-0 left-0 z-40 border-r lg:static',
          'transform transition-all duration-300 ease-in-out lg:block',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-16' : 'w-full sm:w-80 lg:w-64'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='border-border relative border-b p-6'>
            {!isCollapsed && (
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
                'absolute top-6 right-4 hidden rounded-md p-1 text-gray-400 transition-colors hover:text-gray-600 lg:flex dark:hover:text-gray-300',
                isCollapsed && 'right-auto left-4'
              )}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
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
                  'flex items-center rounded-md text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                  pathname === '/docs'
                    ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
                )}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? 'Overview' : undefined}
              >
                <ArchiveBoxIcon className={cn('h-4 w-4 shrink-0', !isCollapsed && 'mr-3')} />
                {!isCollapsed && <span>首页</span>}
              </Link>

              {/* Doc pages */}
              {docPages.length > 0 && (
                <div className='pt-4'>
                  {!isCollapsed && (
                    <h3 className='mb-2 px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400'>
                      Pages
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
                            'flex items-center rounded-md text-sm font-medium transition-colors',
                            isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                            isActive
                              ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
                          )}
                          onClick={() => setIsOpen(false)}
                          title={isCollapsed ? page.title : undefined}
                        >
                          <DocumentTextIcon
                            className={cn('h-4 w-4 shrink-0', !isCollapsed && 'mr-3')}
                          />
                          {!isCollapsed && <span className='truncate'>{page.title}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Footer */}
          {!isCollapsed && (
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
      </aside>
    </>
  );
}
