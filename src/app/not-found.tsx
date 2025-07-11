import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900'>
      <div className='max-w-md mx-auto text-center p-6 bg-white dark:bg-slate-800 rounded-lg shadow-lg'>
        <h2 className='text-4xl font-bold text-gray-800 dark:text-gray-200 mb-4'>404</h2>
        <h3 className='text-xl font-semibold text-gray-600 dark:text-gray-400 mb-4'>页面未找到</h3>
        <p className='text-gray-500 dark:text-gray-500 mb-6'>抱歉，您访问的页面不存在。</p>
        <Link
          href='/'
          className='inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors dark:bg-blue-600 dark:hover:bg-blue-700'
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
