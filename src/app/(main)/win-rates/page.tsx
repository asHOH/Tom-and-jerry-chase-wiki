import { Metadata } from 'next';

import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import type { FactionId } from '@/data/types';

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

export default async function WinRatesPage() {
  const characters = await getPublishedDomainReadModel('characters');
  const characterFactions = Object.fromEntries(
    Object.values(characters.data).map((character) => [character.id, character.factionId])
  ) as Record<string, FactionId>;
  return <WinRatesClient description={DESCRIPTION} characterFactions={characterFactions} />;
}
