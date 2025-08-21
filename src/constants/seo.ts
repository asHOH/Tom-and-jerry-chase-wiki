import type { Metadata } from 'next';
import { DISCLAIMER_TEXT } from '@/constants';

export const SITE_NAME = '猫和老鼠手游wiki';
export const SITE_SHORT_NAME = '猫鼠wiki';
export const SITE_URL = 'https://tjwiki.com';
export const SITE_LANG = 'zh-CN';
export const SITE_LOCALE = 'zh_CN';
export const DEFAULT_IMAGE = '/icon.png';
export const SITE_TAGLINE =
  '萌新友好的维基百科网站，涵盖角色属性、技能、加点、克制关系、知识卡、特技、道具等，更多功能正持续开发中';

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
  title: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: 'index, follow',
  alternates: { canonical: SITE_URL },
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
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      alternateName: SITE_SHORT_NAME,
      description: `${SITE_NAME} - ${SITE_TAGLINE}`,
      url: SITE_URL,
      inLanguage: SITE_LANG,
    }),
  },
};
