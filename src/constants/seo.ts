import type { Metadata } from 'next';
import { DISCLAIMER_TEXT } from '@/constants';
import { WebSite, WithContext } from 'schema-dts';

export const SITE_NAME = '猫和老鼠手游wiki';
export const SITE_SHORT_NAME = '猫鼠wiki';
export const SITE_ALTERNATE_NAME = [
  SITE_SHORT_NAME,
  '猫和老鼠手游百科',
  '猫鼠百科',
  'Tom and Jerry Chase Wiki',
  'tjwiki.com',
];
export const SITE_URL = 'https://tjwiki.com';
export const SITE_LANG = 'zh-CN';
export const SITE_LOCALE = 'zh_CN';
export const DEFAULT_IMAGE = '/icon.png';
export const SITE_TAGLINE =
  '萌新友好的猫鼠手游维基百科网站，涵盖角色属性、技能、加点、克制关系、知识卡、特技、道具等，更多功能正持续开发中';

export const DEFAULT_DESCRIPTION = `${SITE_NAME} - ${SITE_TAGLINE}。${DISCLAIMER_TEXT}`;
export const DEFAULT_KEYWORDS = [
  '猫和老鼠手游',
  'wiki',
  '攻略',
  '角色',
  '技能',
  '知识卡',
  'Tom and Jerry Chase',
];

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s - ${SITE_SHORT_NAME}` },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  },
  alternates: { canonical: SITE_URL, languages: { 'zh-CN': SITE_URL, 'x-default': SITE_URL } },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_SHORT_NAME,
    startupImage: DEFAULT_IMAGE,
  },
  openGraph: {
    type: 'website',
    locale: SITE_LOCALE,
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_TAGLINE,
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_IMAGE, width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [DEFAULT_IMAGE],
  },
  icons: {
    icon: DEFAULT_IMAGE,
    shortcut: '/favicon.ico',
    apple: DEFAULT_IMAGE,
  },
  other: {
    'application-name': SITE_NAME,
    'msapplication-TileColor': '#1e293b',
    'msapplication-TileImage': DEFAULT_IMAGE,
    'apple-mobile-web-app-capable': 'yes',
  },
};

export function getSiteJsonLd(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAME,
    description: `${SITE_NAME} - ${SITE_TAGLINE}`,
    url: SITE_URL,
    inLanguage: SITE_LANG,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    license: [
      'https://creativecommons.org/licenses/by/4.0/',
      'https://www.gnu.org/licenses/gpl-3.0.html',
    ],
  } as const;
}
