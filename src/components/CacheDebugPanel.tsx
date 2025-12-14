'use client';

import { useEffect, useState } from 'react';

import { useToast } from '@/context/ToastContext';

export const CacheDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<string[]>([]);
  const { success } = useToast();

  const getCacheInfo = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      setCacheInfo(cacheNames);
    }
  };

  useEffect(() => {
    // Show debug panel with Ctrl+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(!isVisible);
        if (!isVisible) {
          getCacheInfo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const clearAllCaches = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      setCacheInfo([]);
      success('缓存已清除！页面即将刷新。');
      // Delay reload to show notification
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const forceReload = () => {
    // Force reload with cache bypass
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <div className='bg-opacity-90 fixed top-4 right-4 z-50 max-w-sm rounded-lg bg-black p-4 text-white'>
      <div className='mb-2 flex items-center justify-between'>
        <h3 className='font-bold'>Cache Debug Panel</h3>
        <button
          type='button'
          onClick={() => setIsVisible(false)}
          className='text-white hover:text-gray-300'
        >
          ✕
        </button>
      </div>
      <div className='space-y-2 text-xs'>
        <div>
          <strong>Active Caches:</strong>
          {cacheInfo.length === 0 ? (
            <div>None</div>
          ) : (
            <ul className='list-inside list-disc'>
              {cacheInfo.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className='space-y-1'>
          <button
            type='button'
            onClick={clearAllCaches}
            className='w-full rounded bg-red-600 px-2 py-1 text-xs hover:bg-red-700'
          >
            Clear All Caches
          </button>
          <button
            type='button'
            onClick={forceReload}
            className='w-full rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700'
          >
            Force Reload
          </button>
          <button
            type='button'
            onClick={getCacheInfo}
            className='w-full rounded bg-gray-600 px-2 py-1 text-xs hover:bg-gray-700'
          >
            Refresh Cache Info
          </button>
        </div>
        <div className='text-xs text-gray-300'>Press Ctrl+Shift+D to toggle</div>
      </div>
    </div>
  );
};
