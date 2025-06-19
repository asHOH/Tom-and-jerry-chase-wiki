'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null for SSR
  const [showNotification, setShowNotification] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasOfflineRef = useRef(false);

  const clearNotificationTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setNotificationTimeout = useCallback(() => {
    clearNotificationTimeout();
    setShowNotification(true);
    timeoutRef.current = setTimeout(() => {
      setShowNotification(false);
      timeoutRef.current = null;
    }, 4000);
  }, [clearNotificationTimeout]);

  useEffect(() => {
    // Initialize online status on client side only
    const initialStatus = navigator.onLine;
    setIsOnline(initialStatus);
    wasOfflineRef.current = !initialStatus;

    const handleOnline = () => {
      setIsOnline(true);
      if (wasOfflineRef.current) {
        setNotificationTimeout();
      }
      wasOfflineRef.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOfflineRef.current = true;
      setNotificationTimeout();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearNotificationTimeout();
    };
  }, [setNotificationTimeout, clearNotificationTimeout]);

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

  if (!showNotification && isOnline) return null;

  return (
    <>
      {' '}
      {/* Persistent offline indicator - positioned below navigation bar */}
      {!isOnline && (
        <div className='fixed left-0 right-0 bg-gray-600 text-gray-100 px-4 py-2 text-sm font-medium z-[9998] offline-banner'>
          <div className='flex items-center justify-center space-x-2'>
            <div className='w-2 h-2 bg-gray-300 rounded-full animate-pulse'></div>
            <span>您正在离线浏览 - 仅显示已缓存的内容</span>
          </div>
        </div>
      )}
      {/* Notification toast */}
      {showNotification && (
        <div
          className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-[10000] transform transition-all duration-300 max-w-sm ${
            isOnline ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-100'
          }`}
        >
          <div className='flex items-center space-x-2'>
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white' : 'bg-gray-300 animate-pulse'}`}
            ></div>
            <span className='font-medium text-sm'>
              {isOnline ? '已重新连接到网络' : '已断开网络连接'}
            </span>
          </div>
          {!isOnline && (
            <div className='text-xs mt-1 opacity-90'>您仍可以浏览已缓存的页面和数据</div>
          )}
        </div>
      )}
    </>
  );
};
