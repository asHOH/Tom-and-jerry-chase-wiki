import Link from 'next/link';
import { getDocPages } from '@/lib/docUtils';

export default async function DocsIndexPage() {
  const docPages = await getDocPages();

  return (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold text-gray-900 dark:text-gray-100'>文档</h1>
        <p className='text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto'>
          欢迎来到猫和老鼠手游维基文档。浏览下面的指南和资源。
        </p>
      </div>

      {docPages.length > 0 ? (
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          {docPages.map((page) => (
            <Link
              key={page.slug}
              href={page.path}
              className='group block p-6 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-md dark:hover:shadow-slate-900/20 no-underline'
            >
              <div className='space-y-3'>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                  {page.title}
                </h2>
                <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
                  <svg
                    className='w-4 h-4 mr-2'
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
                  /{page.slug}
                </div>
                <div className='flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors'>
                  阅读更多
                  <svg
                    className='w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 5l7 7-7 7'
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <div className='text-gray-500 dark:text-gray-400 space-y-2'>
            <svg
              className='w-16 h-16 mx-auto text-gray-300 dark:text-gray-600'
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
