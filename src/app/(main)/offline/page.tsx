'use client';

export default function OfflinePage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900'>
      <div className='mx-auto max-w-md p-6 text-center'>
        <h1 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>离线状态</h1>
        <p className='mb-6 text-gray-600 dark:text-gray-300'>
          您当前处于离线状态，部分功能可能不可用。
        </p>
        <div className='space-y-4'>
          <button
            onClick={() => window.location.reload()}
            className='w-full rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
          >
            重新加载
          </button>
          <button
            onClick={() => window.history.back()}
            className='w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition-colors hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
