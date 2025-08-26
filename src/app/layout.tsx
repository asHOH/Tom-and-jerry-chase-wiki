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

import { DISCLAIMER_TEXT } from '@/constants';
import './globals.css';
import { DarkModeProvider } from '@/context/DarkModeContext';
import { getDarkModeFromCookie } from '@/lib/darkModeActions';
import clsx from 'clsx';
import KeyboardNavigation from '@/components/KeyboardNavigation';
import { UserProvider } from '@/hooks/useUser';
import { getUserData } from '@/lib/userActions';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://tjwiki.com'),
  title: '猫和老鼠手游wiki',
  description: `猫和老鼠手游wiki - 角色技能加点和知识卡效果查询网站。${DISCLAIMER_TEXT}`,
  keywords: '猫和老鼠手游,wiki,攻略,角色,技能,知识卡,Tom and Jerry Chase',
  authors: [{ name: '猫和老鼠手游wiki' }],
  creator: '猫和老鼠手游wiki',
  publisher: '猫和老鼠手游wiki',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://tjwiki.com',
  },
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '猫和老鼠手游wiki',
      alternateName: '猫鼠wiki',
      description: '猫和老鼠手游wiki - 角色技能加点和知识卡效果查询网站',
      url: 'https://tjwiki.com',
      inLanguage: 'zh-CN',
      // TODO: Implement search functionality before enabling this
      // potentialAction: {
      //   '@type': 'SearchAction',
      //   target: 'https://tjwiki.com?search={search_term_string}',
      //   'query-input': 'required name=search_term_string',
      // },
    }),
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://tjwiki.com',
    title: '猫和老鼠手游wiki',
    description: '角色技能加点和知识卡效果查询网站',
    siteName: '猫和老鼠手游wiki',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: '猫和老鼠手游wiki',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: '猫和老鼠手游wiki',
    description: '角色技能加点和知识卡效果查询网站',
    images: ['/icon.png'],
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
};

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
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com https://hcaptcha.com, https://*.hcaptcha.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://hcaptcha.com, https://*.hcaptcha.com; img-src 'self' data:; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com https://vercel-analytics.com https://vercel.live *.supabase.co https://hcaptcha.com, https://*.hcaptcha.com; media-src 'self'; object-src 'none'; child-src 'none'; frame-src https://vercel.live https://hcaptcha.com, https://*.hcaptcha.com https://challenges.cloudflare.com; form-action 'self'; base-uri 'self'; worker-src 'self' blob:;"
        />
        <meta name='format-detection' content='telephone=no, date=no, email=no, address=no' />
        {/* Next.js automatically self-hosts Google Fonts - no external requests needed */}
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <KeyboardNavigation />
          <OfflineIndicator />
          <main className='min-h-screen bg-gray-100 dark:bg-slate-900 relative pt-0'>
            <UserProvider initialValue={getUserData()}>
              <DarkModeProvider initialValue={isDarkMode}>{children}</DarkModeProvider>
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
