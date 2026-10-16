import { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import PublishedRevisionBoundary from '@/components/PublishedRevisionBoundary';

import { buildWinRateCharacterLookup } from './characterLookup';
import WinRatesClient from './WinRatesClient';

export const dynamic = 'force-static';

const DESCRIPTION = '查看角色在各赛季各段位的登场率、胜率和禁用率';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata({
    title: '胜率统计',
    description: DESCRIPTION,
    keywords: ['胜率', '登场率', '禁用率', '角色数据', '赛季统计'],
    canonicalUrl: `${SITE_URL}/win-rates`,
  });
}

export default async function WinRatesPage() {
  const characters = await getPublishedDomainReadModel('characters');
  const characterLookup = buildWinRateCharacterLookup(Object.values(characters.data));
  return (
    <PublishedRevisionBoundary revisions={[characters.revision]}>
      <WinRatesClient description={DESCRIPTION} characterLookup={characterLookup} />
    </PublishedRevisionBoundary>
  );
}
