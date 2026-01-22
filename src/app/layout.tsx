import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import NextTopLoader from 'nextjs-toploader';

import { getRuntimeCspHeader } from '@/lib/csp';
import { isVercelAnalyticsEnabled } from '@/lib/platform';
import { defaultMetadata } from '@/constants/seo';
import { AnalyticsComponent } from '@/components/AnalyticsComponent';
import { ClientProvidersWithInitialData } from '@/components/ClientProvidersWithInitialData';
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
  const vercelAnalyticsEnabled = isVercelAnalyticsEnabled();
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
        {/* Polyfill for TransformStream for browsers that do not support it natively. Known issue with Safari 16. */}
        <Script id='polyfill-transformstream' strategy='beforeInteractive'>
          {`
            (() => {
              if (typeof TransformStream !== 'undefined') return;
              try {
                class SimpleTransformStream {
                  readable;
                  writable;

                  constructor(transformer = {}) {
                    const {
                      start,
                      transform = (chunk, controller) => controller?.enqueue?.(chunk),
                      flush = (controller) => controller?.close?.(),
                      readableStrategy,
                      writableStrategy,
                    } = transformer;

                    let controllerRef;

                    this.readable = new ReadableStream(
                      {
                        start(controller) {
                          controllerRef = controller;
                          return start?.(controller);
                        },
                      },
                      readableStrategy
                    );

                    this.writable = new WritableStream(
                      {
                        write(chunk) {
                          return transform(chunk, controllerRef);
                        },
                        close() {
                          return flush(controllerRef);
                        },
                      },
                      writableStrategy
                    );
                  }
                }

                // @ts-ignore
                self.TransformStream = SimpleTransformStream;
              } catch (err) {
                // Swallow: if this fails, the page will still surface the original error.
              }
            })();
          `}
        </Script>
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
                <ClientProvidersWithInitialData>{children}</ClientProvidersWithInitialData>
              </UserProvider>
            </main>
          </ErrorBoundary>
          <PerformanceMonitor />
          <SpeedInsightsComponent enabled={vercelAnalyticsEnabled} />
          <AnalyticsComponent enabled={vercelAnalyticsEnabled} />
        </DarkModeProvider>
      </body>
    </html>
  );
}
