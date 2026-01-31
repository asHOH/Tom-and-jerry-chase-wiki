'use client';

import { useEffect } from 'react';

export function OfflinePageClient() {
  useEffect(() => {
    // Auto-retry connection after 30 seconds
    const timer = setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      }
    }, 30000);

    // Listen for online event
    const handleOnline = () => {
      window.location.reload();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 p-4 text-gray-800 dark:bg-gray-900 dark:text-gray-200'>
      <div className='max-w-md text-center'>
        <div className='mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-blue-500 text-3xl text-white'>
          📱
        </div>

        <h1 className='mb-4 text-2xl font-semibold'>您正在离线浏览</h1>

        <p className='mb-6 leading-relaxed text-gray-500 dark:text-gray-400'>
          无法连接到互联网，但您仍可以访问已缓存的页面和数据。
        </p>

        <button
          type='button'
          onClick={() => window.location.reload()}
          className='cursor-pointer rounded-lg bg-blue-500 px-6 py-3 text-base text-white transition-colors hover:bg-blue-600'
        >
          重试连接
        </button>

        <div className='mt-8 space-y-2 text-left'>
          <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
            <span className='mr-2 font-bold text-green-500'>✓</span>
            已缓存的角色数据可离线查看
          </div>
          <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
            <span className='mr-2 font-bold text-green-500'>✓</span>
            知识卡信息本地存储
          </div>
          <div className='flex items-center text-sm text-gray-500 dark:text-gray-400'>
            <span className='mr-2 font-bold text-green-500'>✓</span>
            基本功能正常使用
          </div>
        </div>
      </div>
    </div>
  );
}
