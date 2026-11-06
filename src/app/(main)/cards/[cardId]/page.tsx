import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPublishedReferenceRoute } from '@/lib/gameData/published/referenceRoute';
import { getReferenceActionSnapshot } from '@/lib/gameData/published/reverseReferences';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { createArticleJsonLd, generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
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

function generateStructuredData(cardId: string, card: Card) {
  return createArticleJsonLd({
    headline: card.id,
    description: card.description,
    image: card.imageUrl,
    path: `/cards/${encodeURIComponent(cardId)}`,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const cardId = decodeURIComponent(resolvedParams.cardId); // Decode the URL-encoded card ID
  const snapshot = await getReferenceActionSnapshot();
  const { data: card } = await getPublishedEntityRouteReadModel(
    'cards',
    cardId,
    undefined,
    snapshot
  );

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
  const readModel = await getPublishedReferenceRoute('cards', cardId);
  if (!readModel) notFound();
  const card = readModel.data;
  return (
    <>
      <StructuredData data={generateStructuredData(cardId, card)} />
      <KnowledgeCardDetailsClient
        card={card}
        cardId={cardId}
        referencePage={readModel.referencePage}
        publishedRevision={readModel.revision}
        publishedHistory={readModel.history}
        charactersData={readModel.charactersData}
      />
    </>
  );
}
