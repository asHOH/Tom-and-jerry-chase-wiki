import { Metadata } from 'next';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';

import WinRatesClient from './WinRatesClient';

export const dynamic = 'force-static';

const DESCRIPTION = '查看各赛季角色在不同段位的胜率、登场率和禁用率数据';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: '胜率数据统计',
    description: DESCRIPTION,
    keywords: ['胜率', '登场率', '禁用率', '角色数据', '赛季统计'],
    canonicalUrl: `${SITE_URL}/win-rates`,
  });
}

export default function WinRatesPage() {
  return <WinRatesClient description={DESCRIPTION} />;
}
