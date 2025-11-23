import Link from '@/components/Link';

export default function NotFound() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 dark:bg-slate-900'>
      <div className='mx-auto max-w-md rounded-lg bg-white p-6 text-center shadow-lg dark:bg-slate-800'>
        <h2 className='mb-4 text-4xl font-bold text-gray-800 dark:text-gray-200'>404</h2>
        <h3 className='mb-4 text-xl font-semibold text-gray-600 dark:text-gray-400'>页面未找到</h3>
        <p className='mb-6 text-gray-500 dark:text-gray-500'>抱歉，您访问的页面不存在。</p>
        <Link
          href='/'
          className='inline-block rounded bg-blue-500 px-6 py-2 text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
