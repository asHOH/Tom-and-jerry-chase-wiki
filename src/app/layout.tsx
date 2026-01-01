import type { Metadata } from 'next';
import localFont from 'next/font/local';
import NextTopLoader from 'nextjs-toploader';

import { getRuntimeCspHeader } from '@/lib/csp';
import { defaultMetadata } from '@/constants/seo';
import { AnalyticsComponent } from '@/components/AnalyticsComponent';
import { ClientProviders } from '@/components/ClientProviders';
import { DynamicFaviconEditBadge } from '@/components/DynamicFaviconEditBadge';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { SpeedInsightsComponent } from '@/components/SpeedInsights';

import './globals.css';

import { getUserData } from '@/lib/userActions';
import { UserProvider } from '@/hooks/useUser';
import { DarkModeProvider } from '@/context/DarkModeContext';
import KeyboardNavigation from '@/components/KeyboardNavigation';

const inter = localFont({
  src: '../../public/fonts/inter/InterVariable.woff2',
  display: 'swap',
});

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await getUserData();
  return (
    <html
      lang='zh-CN'
      className='bg-gray-100 dark:bg-slate-900'
      data-scroll-behavior='smooth'
      suppressHydrationWarning
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
        <DarkModeProvider>
          <NextTopLoader
            color='#2563eb'
            height={2}
            shadow={false}
            showForHashAnchor={false}
            showSpinner={false}
            zIndex={10050}
          />
          <ErrorBoundary>
            <KeyboardNavigation />
            <DynamicFaviconEditBadge />
            <main className='relative min-h-screen bg-gray-100 pt-0 dark:bg-slate-900'>
              <UserProvider initialValue={initialUser}>
                <ClientProviders>{children}</ClientProviders>
              </UserProvider>
            </main>
          </ErrorBoundary>
          <PerformanceMonitor />
          <SpeedInsightsComponent />
          <AnalyticsComponent />
        </DarkModeProvider>
      </body>
    </html>
  );
}
