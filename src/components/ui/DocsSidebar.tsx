'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { DocPage } from '@/features/articles/utils/docs';
import clsx from 'clsx';

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

interface DocsSidebarProps {
  docPages: DocPage[];
}

export default function DocsSidebar({ docPages }: DocsSidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className='fixed top-4 left-4 z-50 rounded-md border border-gray-200 bg-white p-2 shadow-md lg:hidden dark:border-slate-700 dark:bg-slate-800'
        aria-label='Toggle sidebar'
      >
        {isOpen ? (
          <CloseIcon className='h-6 w-6 text-gray-600 dark:text-gray-300' />
        ) : (
          <svg
            className='h-6 w-6 text-gray-600 dark:text-gray-300'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className='bg-opacity-50 fixed inset-0 z-40 bg-black lg:hidden'
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 border-r border-gray-200 bg-white lg:static dark:border-slate-700 dark:bg-slate-800',
          'transform transition-all duration-300 ease-in-out lg:block',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isCollapsed ? 'lg:w-16' : 'w-full sm:w-80 lg:w-64'
        )}
      >
        <div className='flex h-full flex-col'>
          {/* Header */}
          <div className='relative border-b border-gray-200 p-6 dark:border-slate-700'>
            {!isCollapsed && (
              <>
                <h2 className='text-lg font-semibold text-gray-900 dark:text-gray-100'>文档</h2>
                {/* <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>这里是杂项文档</p> */}
              </>
            )}

            {/* Desktop collapse button */}
            <button
              onClick={toggleCollapse}
              className={clsx(
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
            </button>
          </div>

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto p-4'>
            <div className='space-y-2'>
              {/* Home link */}
              <Link
                href='/docs'
                className={clsx(
                  'flex items-center rounded-md text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                  pathname === '/docs'
                    ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
                )}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? 'Overview' : undefined}
              >
                <svg
                  className={clsx('h-4 w-4 flex-shrink-0', !isCollapsed && 'mr-3')}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
                  />
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 5a2 2 0 012-2h2a2 2 0 012 2v0H8v0z'
                  />
                </svg>
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
                          className={clsx(
                            'flex items-center rounded-md text-sm font-medium transition-colors',
                            isCollapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                            isActive
                              ? 'border-l-4 border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-700'
                          )}
                          onClick={() => setIsOpen(false)}
                          title={isCollapsed ? page.title : undefined}
                        >
                          <svg
                            className={clsx('h-4 w-4 flex-shrink-0', !isCollapsed && 'mr-3')}
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                            />
                          </svg>
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
            <div className='border-t border-gray-200 p-4 dark:border-slate-700'>
              <div className='space-y-1 text-xs text-gray-500 dark:text-gray-400'>
                <p className='flex items-center'>
                  <svg className='mr-1 h-3 w-3' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
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
