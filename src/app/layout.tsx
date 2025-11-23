import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { defaultMetadata } from '@/constants/seo';

import { getRuntimeCspHeader } from '@/lib/csp';
import { AnalyticsComponent } from '@/components/AnalyticsComponent';
import { CacheDebugPanel } from '@/components/CacheDebugPanel';
import { ClientProviders } from '@/components/ClientProviders';
import { DynamicFaviconEditBadge } from '@/components/DynamicFaviconEditBadge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { SpeedInsightsComponent } from '@/components/SpeedInsights';
import { VersionChecker } from '@/components/VersionChecker';

import './globals.css';

import { DarkModeProvider } from '@/context/DarkModeContext';
import clsx from 'clsx';

import { getDarkModeFromCookie } from '@/lib/darkModeActions';
import { getUserData } from '@/lib/userActions';
import { UserProvider } from '@/hooks/useUser';
import KeyboardNavigation from '@/components/KeyboardNavigation';

const inter = localFont({
  src: '../../public/fonts/inter/InterVariable.woff2',
  display: 'swap',
});

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const isDarkMode = await getDarkModeFromCookie();
  return (
    <html
      lang='zh-CN'
      className={clsx('bg-gray-100 dark:bg-slate-900', isDarkMode && 'dark')}
      data-scroll-behavior='smooth'
    >
      <head>
        <meta httpEquiv='X-Content-Type-Options' content='nosniff' />
        <meta httpEquiv='X-XSS-Protection' content='1; mode=block' />
        <meta name='referrer' content='strict-origin-when-cross-origin' />
        <meta httpEquiv='Content-Security-Policy' content={getRuntimeCspHeader()} />
        <meta name='format-detection' content='telephone=no, date=no, email=no, address=no' />
        {/* Next.js automatically self-hosts Google Fonts - no external requests needed */}
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <KeyboardNavigation />
          <OfflineIndicator />
          <DynamicFaviconEditBadge />
          <main className='relative min-h-screen bg-gray-100 pt-0 dark:bg-slate-900'>
            <UserProvider initialValue={getUserData()}>
              <DarkModeProvider initialValue={isDarkMode}>
                <ClientProviders>{children}</ClientProviders>
              </DarkModeProvider>
            </UserProvider>
          </main>
        </ErrorBoundary>
        <PerformanceMonitor />
        <ServiceWorkerRegistration />
        <CacheDebugPanel />
        <VersionChecker />
        <SpeedInsightsComponent />
        <AnalyticsComponent />
      </body>
    </html>
  );
}
