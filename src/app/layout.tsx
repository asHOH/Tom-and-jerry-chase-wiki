import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { CacheDebugPanel } from '@/components/CacheDebugPanel';
import { VersionChecker } from '@/components/VersionChecker';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DISCLAIMER_TEXT } from '@/constants';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://tom-and-jerry-chase-wiki.space'),
  title: '猫和老鼠手游wiki',
  description: `猫和老鼠手游wiki - 角色技能加点和知识卡效果查询网站。${DISCLAIMER_TEXT}`,
  keywords: '猫和老鼠手游,wiki,攻略,角色,技能,知识卡,Tom and Jerry Chase',
  authors: [{ name: '猫和老鼠手游wiki' }],
  creator: '猫和老鼠手游wiki',
  publisher: '猫和老鼠手游wiki',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://tom-and-jerry-chase-wiki.space',
  },
  other: {
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: '猫和老鼠手游wiki',
      alternateName: '猫鼠wiki',
      description: '猫和老鼠手游wiki - 角色技能加点和知识卡效果查询网站',
      url: 'https://tom-and-jerry-chase-wiki.space',
      inLanguage: 'zh-CN',
      // TODO: Implement search functionality before enabling this
      // potentialAction: {
      //   '@type': 'SearchAction',
      //   target: 'https://tom-and-jerry-chase-wiki.space?search={search_term_string}',
      //   'query-input': 'required name=search_term_string',
      // },
    }),
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: 'https://tom-and-jerry-chase-wiki.space',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='zh-CN'>
      <head>
        <meta httpEquiv='X-Content-Type-Options' content='nosniff' />
        <meta httpEquiv='X-XSS-Protection' content='1; mode=block' />
        <meta name='referrer' content='strict-origin-when-cross-origin' />
        <meta
          httpEquiv='Content-Security-Policy'
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'none'; form-action 'self'; base-uri 'self'; worker-src 'self';"
        />
        {/* Preload critical resources */}
        <link rel='preload' href='/images/icons/cat faction.png' as='image' type='image/png' />
        <link rel='preload' href='/images/icons/mouse faction.png' as='image' type='image/png' />
        <link
          rel='preload'
          href='/images/icons/cat knowledge card.png'
          as='image'
          type='image/png'
        />
        <link
          rel='preload'
          href='/images/icons/mouse knowledge card.png'
          as='image'
          type='image/png'
        />
        {/* Next.js automatically self-hosts Google Fonts - no external requests needed */}
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <OfflineIndicator />
          <main className='min-h-screen bg-gray-100 relative pt-0'>{children}</main>
        </ErrorBoundary>
        <PerformanceMonitor />
        <ServiceWorkerRegistration />
        <CacheDebugPanel />
        <VersionChecker />
      </body>
    </html>
  );
}
