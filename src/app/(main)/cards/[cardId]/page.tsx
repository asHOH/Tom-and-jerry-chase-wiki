import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import { cards as canonicalCards } from '@/data/static';
import type { Card } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import KnowledgeCardDetailsClient from './KnowledgeCardDetailsClient';

export const dynamic = 'force-static';

// Generate static params for all cards
export function generateStaticParams() {
  return Object.keys(canonicalCards).map((cardId) => ({
    cardId: cardId, // Don't encode here - Next.js will handle it
  }));
}

function generateStructuredData(cardId: string, card: Card): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: card.id,
    description: card.description,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: SITE_URL },
    ...(card.imageUrl === undefined ? {} : { image: card.imageUrl }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/cards/${encodeURIComponent(cardId)}`,
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const cardId = decodeURIComponent(resolvedParams.cardId); // Decode the URL-encoded card ID
  const { data: card } = await getPublishedEntityRouteReadModel('cards', cardId);

  if (!card) {
    return {};
  }

  return generateArticleMetadata({
    title: card.id,
    description: card.description,
    keywords: [card.id, '知识卡'],
    canonicalUrl: getCanonicalUrl(`/cards/${encodeURIComponent(cardId)}`),
    imageUrl: card.imageUrl,
  });
}

// This page uses the KnowledgeCardDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const resolvedParams = await params;
  const cardId = decodeURIComponent(resolvedParams.cardId); // Decode the URL-encoded card ID
  const snapshot = await getApprovedActionSnapshot();
  const [readModel, characters] = await Promise.all([
    getPublishedEntityRouteReadModel('cards', cardId, undefined, snapshot),
    getPublishedDomainReadModel('characters', snapshot),
  ]);
  const card = readModel.data;

  if (!card) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(cardId, card)} />
      <KnowledgeCardDetailsClient
        card={card}
        cardId={cardId}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
        charactersData={characters.data}
      />
    </>
  );
}
