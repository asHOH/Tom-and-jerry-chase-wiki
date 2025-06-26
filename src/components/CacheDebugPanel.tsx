'use client';

import { useState, useEffect } from 'react';

export const CacheDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<string[]>([]);

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

  const getCacheInfo = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      setCacheInfo(cacheNames);
    }
  };

  const clearAllCaches = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      setCacheInfo([]);
      alert('All caches cleared! The page will refresh.');
      window.location.reload();
    }
  };

  const forceReload = () => {
    // Force reload with cache bypass
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <div className='fixed top-4 right-4 bg-black bg-opacity-90 text-white p-4 rounded-lg z-50 max-w-sm'>
      <div className='flex justify-between items-center mb-2'>
        <h3 className='font-bold'>Cache Debug Panel</h3>
        <button
          type='button'
          onClick={() => setIsVisible(false)}
          className='text-white hover:text-gray-300'
        >
          ✕
        </button>
      </div>
      <div className='text-xs space-y-2'>
        <div>
          <strong>Active Caches:</strong>
          {cacheInfo.length === 0 ? (
            <div>None</div>
          ) : (
            <ul className='list-disc list-inside'>
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
            className='w-full bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs'
          >
            Clear All Caches
          </button>
          <button
            type='button'
            onClick={forceReload}
            className='w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs'
          >
            Force Reload
          </button>
          <button
            type='button'
            onClick={getCacheInfo}
            className='w-full bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-xs'
          >
            Refresh Cache Info
          </button>
        </div>
        <div className='text-xs text-gray-300'>Press Ctrl+Shift+D to toggle</div>
      </div>
    </div>
  );
};
