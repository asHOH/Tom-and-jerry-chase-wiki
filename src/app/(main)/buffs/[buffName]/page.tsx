import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
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

function generateStructuredData(buffName: string, buff: Buff) {
  const desc = buff.description ?? `${buff.name}详细信息`;
  return createArticleJsonLd({
    headline: buff.name,
    description: desc,
    path: `/buffs/${encodeURIComponent(buffName)}`,
    image: buff.imageUrl,
  });
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
      <BuffDetailClient
        buff={buff}
        buffName={buffName}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
      />
    </>
  );
}
