import type { Metadata } from 'next';
import { DISCLAIMER_TEXT } from '@/constants';

export const SITE_NAME = '猫和老鼠手游wiki';
export const SITE_SHORT_NAME = '猫鼠wiki';
export const SITE_URL = 'https://tjwiki.com';
export const SITE_LANG = 'zh-CN';
export const SITE_LOCALE = 'zh_CN';
export const DEFAULT_IMAGE = '/icon.png';

export const DEFAULT_DESCRIPTION = `${SITE_NAME} - 角色技能加点和知识卡效果查询网站。${DISCLAIMER_TEXT}`;
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
    description: '角色技能加点和知识卡效果查询网站',
    siteName: SITE_NAME,
    images: [{ url: DEFAULT_IMAGE, width: 512, height: 512, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: '角色技能加点和知识卡效果查询网站',
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
      description: '猫和老鼠手游wiki - 角色技能加点和知识卡效果查询网站',
      url: SITE_URL,
      inLanguage: SITE_LANG,
    }),
  },
};
