import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { buffs as canonicalBuffs } from '@/data/static';
import type { Buff } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import BuffDetailClient from './BuffDetailsClient';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(canonicalBuffs).map((buffName) => ({
    buffName,
  }));
}

function generateStructuredData(buffName: string, buff: Buff): WithContext<Article> {
  const desc = buff.description ?? `${buff.name}详细信息`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: buff.name,
    description: desc,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/buffs/${encodeURIComponent(buffName)}`,
    },
    image: buff.imageUrl,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ buffName: string }>;
}): Promise<Metadata> {
  const buffName = decodeURIComponent((await params).buffName);
  const { data: buff } = await getPublishedEntityRouteReadModel('buffs', buffName);

  if (!buff) {
    return {};
  }

  const desc = buff.description ?? `${buff.name}详细信息`;
  return generateArticleMetadata({
    title: buff.name,
    description: desc,
    keywords: [buff.name, '状态'],
    canonicalUrl: getCanonicalUrl(`/buffs/${encodeURIComponent(buffName)}`),
    imageUrl: buff.imageUrl,
  });
}

export default async function BuffDetailPage({
  params,
}: {
  params: Promise<{ buffName: string }>;
}) {
  const buffName = decodeURIComponent((await params).buffName);
  const readModel = await getPublishedEntityRouteReadModel('buffs', buffName);
  const buff = readModel.data;

  if (!buff) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(buffName, buff)} />
      <BuffDetailClient buff={buff} buffName={buffName} publishedRevision={readModel.revision} />
    </>
  );
}
