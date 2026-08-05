import type { Metadata } from 'next';
import { Noto_Sans_SC } from 'next/font/google';
import localFont from 'next/font/local';
import NextTopLoader from 'nextjs-toploader';

import { getRuntimeCspHeader } from '@/lib/csp';
import { cn } from '@/lib/design';
import { isVercelAnalyticsEnabled } from '@/lib/platform';
import { defaultMetadata } from '@/constants/seo';
import { AnalyticsComponent } from '@/components/AnalyticsComponent';
import { ClientProviders } from '@/components/ClientProviders';
import { DisableLinkPrefetch } from '@/components/DisableLinkPrefetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import IcpFooter from '@/components/IcpFooter';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { SpeedInsightsComponent } from '@/components/SpeedInsights';

import './globals.css';

import { Suspense } from 'react';

import { getUserData } from '@/lib/userActions';
import { UserProvider } from '@/hooks/useUser';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { EditModeProvider } from '@/context/EditModeContext';
import KeyboardNavigation from '@/components/KeyboardNavigation';

const inter = localFont({
  src: '../../public/fonts/inter/InterVariable.woff2',
  display: 'swap',
  variable: '--font-sans',
});

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  variable: '--font-cjk',
});

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialUser = await getUserData();
  const vercelAnalyticsEnabled = isVercelAnalyticsEnabled();
  const isVercel = process.env.VERCEL === '1';
  return (
    <html lang='zh-CN' data-scroll-behavior='smooth' suppressHydrationWarning>
      <head>
        <meta httpEquiv='X-Content-Type-Options' content='nosniff' />
        <meta httpEquiv='X-XSS-Protection' content='1; mode=block' />
        <meta name='referrer' content='strict-origin-when-cross-origin' />
        <meta httpEquiv='Content-Security-Policy' content={getRuntimeCspHeader()} />
        <meta name='format-detection' content='telephone=no, date=no, email=no, address=no' />
        {/* Next.js automatically self-hosts Google Fonts - no external requests needed */}
      </head>
      <body className={cn(inter.className, inter.variable, notoSansSC.variable)}>
        <DarkModeProvider>
          <NextTopLoader
            color='#2563eb'
            height={2}
            shadow={false}
            showForHashAnchor={false}
            showSpinner={false}
            zIndex={10050}
          />
          {isVercel ? <DisableLinkPrefetch /> : null}
          <ErrorBoundary>
            <main className='relative min-h-screen pt-0'>
              <UserProvider initialValue={initialUser}>
                <Suspense fallback={null}>
                  <EditModeProvider>
                    <KeyboardNavigation />
                    <ClientProviders>{children}</ClientProviders>
                  </EditModeProvider>
                </Suspense>
              </UserProvider>
            </main>
          </ErrorBoundary>
          <IcpFooter />
          <PerformanceMonitor />
          <SpeedInsightsComponent enabled={vercelAnalyticsEnabled} />
          <AnalyticsComponent enabled={vercelAnalyticsEnabled} />
        </DarkModeProvider>
      </body>
    </html>
  );
}
