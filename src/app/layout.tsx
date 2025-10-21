import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { CacheDebugPanel } from '@/components/CacheDebugPanel';
import { VersionChecker } from '@/components/VersionChecker';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SpeedInsightsComponent } from '@/components/SpeedInsights';
import { AnalyticsComponent } from '@/components/AnalyticsComponent';
import { DynamicFaviconEditBadge } from '@/components/DynamicFaviconEditBadge';
import { ClientProviders } from '@/components/ClientProviders';

import { defaultMetadata, getSiteJsonLd } from '@/constants/seo';
import { cspHeaderValue } from '@/constants/csp';
import './globals.css';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { getDarkModeFromCookie } from '@/lib/darkModeActions';
import clsx from 'clsx';
import KeyboardNavigation from '@/components/KeyboardNavigation';
import { UserProvider } from '@/hooks/useUser';
import { getUserData } from '@/lib/userActions';

const inter = Inter({ subsets: ['latin'] });

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
        <meta httpEquiv='Content-Security-Policy' content={cspHeaderValue} />
        <meta name='format-detection' content='telephone=no, date=no, email=no, address=no' />
        {/* Next.js automatically self-hosts Google Fonts - no external requests needed */}
      </head>
      <body className={inter.className}>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(getSiteJsonLd()) }}
        />
        <ErrorBoundary>
          <KeyboardNavigation />
          <OfflineIndicator />
          <DynamicFaviconEditBadge />
          <main className='min-h-screen bg-gray-100 dark:bg-slate-900 relative pt-0'>
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
