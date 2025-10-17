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
        <meta
          httpEquiv='Content-Security-Policy'
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com; img-src 'self' data: https://vitals.vercel-insights.com https://*.supabase.co; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com https://vercel-analytics.com https://vercel.live *.supabase.co https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com; media-src 'self'; object-src 'none'; child-src 'self' about: https://vercel.live https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com; frame-src 'self' about: https://vercel.live https://hcaptcha.com https://*.hcaptcha.com https://challenges.cloudflare.com; form-action 'self'; base-uri 'self'; worker-src 'self' blob:;"
        />
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
