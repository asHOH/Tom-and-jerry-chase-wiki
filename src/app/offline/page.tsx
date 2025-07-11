'use client';

export default function OfflinePage() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900'>
      <div className='max-w-md mx-auto text-center p-6'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>离线状态</h1>
        <p className='text-gray-600 dark:text-gray-300 mb-6'>您当前处于离线状态，部分功能可能不可用。</p>
        <div className='space-y-4'>
          <button
            onClick={() => window.location.reload()}
            className='w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800'
          >
            重新加载
          </button>
          <button
            onClick={() => window.history.back()}
            className='w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
          >
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
}
