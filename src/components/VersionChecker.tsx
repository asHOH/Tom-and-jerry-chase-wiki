'use client';

import { useEffect, useState } from 'react';
import NotificationTooltip from './ui/NotificationTooltip';

interface VersionInfo {
  version: string;
  commitSha: string;
  buildTime: string;
  environment: string;
  packageVersion: string;
}

export const VersionChecker: React.FC = () => {
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(true);
  const [debugInfo, setDebugInfo] = useState<{
    status: 'loading' | 'ready' | 'error';
    lastCheck: string | null;
    error: string | null;
    retryCount: number;
  }>({ status: 'loading', lastCheck: null, error: null, retryCount: 0 });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Request deduplication state
  const [isCheckingVersion, setIsCheckingVersion] = useState(false);
  const [lastVersionResponse, setLastVersionResponse] = useState<{
    data: VersionInfo | null;
    timestamp: number;
  }>({ data: null, timestamp: 0 });

  useEffect(() => {
    // Load initial version info
    const loadInitialVersion = async () => {
      try {
        setDebugInfo((prev) => ({ ...prev, status: 'loading' }));
        const response = await fetch('/api/version', { cache: 'no-cache' });

        if (response.ok) {
          const versionInfo: VersionInfo = await response.json();
          setCurrentVersion(versionInfo.version);
          setDebugInfo({
            status: 'ready',
            lastCheck: new Date().toLocaleTimeString(),
            error: null,
            retryCount: 0,
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setDebugInfo((prev) => ({
          status: 'error',
          lastCheck: new Date().toLocaleTimeString(),
          error: errorMessage,
          retryCount: prev.retryCount + 1,
        }));
      }
    };

    loadInitialVersion();
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Reset retry count when network recovers
      setDebugInfo((prev) => ({ ...prev, retryCount: 0, error: null }));
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!currentVersion) return;

    // Check for updates every 2 minutes
    const checkForUpdates = async () => {
      // Skip if offline
      if (!isOnline) {
        setDebugInfo((prev) => ({
          ...prev,
          lastCheck: new Date().toLocaleTimeString(),
          error: '离线状态，跳过检查',
        }));
        return;
      }

      // Request deduplication: Skip if already checking
      if (isCheckingVersion) {
        setDebugInfo((prev) => ({
          ...prev,
          lastCheck: new Date().toLocaleTimeString(),
          error: '检查进行中，跳过重复请求',
        }));
        return;
      }

      // Helper function to handle version updates
      const handleVersionUpdate = async (versionInfo: VersionInfo, source: string) => {
        console.log(
          `Version update detected (${source}): ${currentVersion} → ${versionInfo.version}`
        );
        setNotificationMessage(`正在更新到最新版本 ${versionInfo.version}...`);
        setShowUpdateNotice(true);

        // Update service worker if available
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            registration.update();
          }
        }

        // Auto-reload after showing notice for 3 seconds
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      };

      // Use cached response if it's fresh (less than 30 seconds old)
      const now = Date.now();
      const cacheAge = now - lastVersionResponse.timestamp;
      if (lastVersionResponse.data && cacheAge < 30000) {
        const versionInfo = lastVersionResponse.data;
        if (versionInfo.version !== currentVersion) {
          await handleVersionUpdate(versionInfo, 'cached');
        }
        return;
      }

      try {
        setIsCheckingVersion(true);
        setDebugInfo((prev) => ({ ...prev, lastCheck: new Date().toLocaleTimeString() }));

        // Check version.json for updates
        const response = await fetch('/api/version?_t=' + Date.now(), {
          cache: 'no-cache',
        });

        if (response.ok) {
          const versionInfo: VersionInfo = await response.json();

          // Cache the response
          setLastVersionResponse({
            data: versionInfo,
            timestamp: now,
          });

          if (versionInfo.version !== currentVersion) {
            await handleVersionUpdate(versionInfo, 'fresh');
            return;
          }
        }

        // Reset retry count on successful check
        setDebugInfo((prev) => ({ ...prev, retryCount: 0, error: null }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setDebugInfo((prev) => ({
          ...prev,
          error: errorMessage,
          lastCheck: new Date().toLocaleTimeString(),
          retryCount: prev.retryCount + 1,
        }));
        console.log('Update check failed:', error);
      } finally {
        setIsCheckingVersion(false);
      }
    };

    const initialTimer = setTimeout(checkForUpdates, 30000);
    const interval = setInterval(checkForUpdates, 120000); // 2 minutes

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [
    currentVersion,
    debugInfo.retryCount,
    isCheckingVersion,
    isOnline,
    lastVersionResponse.data,
    lastVersionResponse.timestamp,
  ]);

  // Listen for service worker updates (fallback method)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        if (!showUpdateNotice) {
          setNotificationMessage('检测到新版本，正在更新...');
          setShowUpdateNotice(true);
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }

    // Return empty cleanup function if service worker not available
    return () => {};
  }, [showUpdateNotice]);

  return (
    <>
      {/* Debug Panel - Only in development */}
      {process.env.NODE_ENV === 'development' && showDebugPanel && (
        <div className='fixed top-20 right-4 bg-gray-800 text-white px-3 py-2 rounded text-xs font-mono z-40 max-w-xs shadow-lg border border-gray-600'>
          <div className='flex justify-between items-center mb-2'>
            <div className='text-sm font-bold'>版本检查器</div>
            <button
              type='button'
              onClick={() => setShowDebugPanel(false)}
              className='text-gray-400 hover:text-white text-lg leading-none'
              title='关闭调试面板'
            >
              ×
            </button>
          </div>
          <div className='space-y-1'>
            <div>状态: {debugInfo.status}</div>
            <div>版本: {currentVersion || '加载中...'}</div>
            <div>最后检查: {debugInfo.lastCheck || '从未'}</div>
            {debugInfo.error && <div className='text-red-300'>错误: {debugInfo.error}</div>}
          </div>
        </div>
      )}

      {/* Debug Panel Toggle - Only in development when panel is hidden */}
      {process.env.NODE_ENV === 'development' && !showDebugPanel && (
        <button
          type='button'
          onClick={() => setShowDebugPanel(true)}
          className='fixed top-20 right-4 bg-gray-800 text-white px-2 py-1 rounded text-xs font-mono z-40 hover:bg-gray-700'
          title='显示调试面板'
        >
          调试
        </button>
      )}

      {/* Update Notice */}
      <NotificationTooltip
        message={notificationMessage}
        show={showUpdateNotice}
        onHide={() => setShowUpdateNotice(false)}
        duration={3000}
        type='info'
      />
    </>
  );
};
