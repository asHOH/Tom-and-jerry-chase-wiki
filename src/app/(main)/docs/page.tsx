import { getDocPages } from '@/features/articles/utils/docs';

import { ChevronRightIcon } from '@/components/icons/CommonIcons';
import Link from '@/components/Link';

export default async function DocsIndexPage() {
  const docPages = await getDocPages();

  return (
    <div className='space-y-8'>
      <div className='space-y-4 text-center'>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-gray-100'>文档</h1>
        <p className='mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400'>
          欢迎来到猫和老鼠手游维基文档。浏览下面的指南和资源。
        </p>
      </div>

      {docPages.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {docPages.map((page) => (
            <Link
              key={page.slug}
              href={page.path}
              className='group block rounded-lg border border-gray-200 bg-white p-6 no-underline transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:shadow-slate-900/20'
            >
              <div className='space-y-3'>
                <h2 className='text-xl font-semibold text-gray-900 transition-colors group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400'>
                  {page.title}
                </h2>
                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                  <svg
                    className='mr-2 h-4 w-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  /docs/{page.slug}
                </div>
                <div className='flex items-center text-sm font-medium text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300'>
                  阅读更多
                  <ChevronRightIcon className='ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1' />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className='py-12 text-center'>
          <div className='space-y-2 text-gray-500 dark:text-gray-400'>
            <svg
              className='mx-auto h-16 w-16 text-gray-300 dark:text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
            <p className='text-lg'>未找到文档页面</p>
            <p className='text-sm'>将 MDX 文件添加到 docs 目录以在此处列出它们。</p>
          </div>
        </div>
      )}
    </div>
  );
}
