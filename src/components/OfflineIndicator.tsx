'use client';

import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/context/ToastContext';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null for SSR
  const wasOfflineRef = useRef(false);
  const { success, warning } = useToast();

  useEffect(() => {
    // Initialize online status on client side only
    const initialStatus = navigator.onLine;
    setIsOnline(initialStatus);
    wasOfflineRef.current = !initialStatus;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        success('已重新连接到网络');
      }
      wasOfflineRef.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      warning('已断开网络连接 - 您仍可以浏览已缓存的页面和数据');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [success, warning]);

  // Apply body class when offline
  useEffect(() => {
    if (typeof document !== 'undefined' && isOnline !== null) {
      if (!isOnline) {
        document.body.classList.add('offline-banner-visible');
      } else {
        document.body.classList.remove('offline-banner-visible');
      }
    }
  }, [isOnline]);

  // Don't render anything during SSR or initial hydration
  if (isOnline === null) return null;

  if (isOnline) return null;

  return (
    <>
      {' '}
      {/* Persistent offline indicator - positioned below navigation bar */}
      {!isOnline && (
        <div className='offline-banner fixed right-0 left-0 z-[9998] bg-gray-600 px-4 py-2 text-sm font-medium text-gray-100'>
          <div className='flex items-center justify-center space-x-2'>
            <div className='h-2 w-2 animate-pulse rounded-full bg-gray-300'></div>
            <span>您正在离线浏览 - 仅显示已缓存的内容</span>
          </div>
        </div>
      )}
    </>
  );
};
