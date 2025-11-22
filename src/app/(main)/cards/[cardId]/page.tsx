import { cards } from '@/data';
import { generateArticleMetadata } from '@/lib/metadataUtils';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import KnowledgeCardDetailsClient from './KnowledgeCardDetailsClient';
import { Article, WithContext } from 'schema-dts';
import StructuredData from '@/components/StructuredData';

export const dynamic = 'force-static';

// Generate static params for all cards
export function generateStaticParams() {
  return Object.keys(cards).map((cardId) => ({
    cardId: cardId, // Don't encode here - Next.js will handle it
  }));
}

function generateStructuredData(cardId: string): WithContext<Article> | null {
  const card = cards[cardId];

  if (!card) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${card.id} - 猫鼠wiki`,
    description: card.description,
    author: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
    image: card.imageUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/cards/${encodeURIComponent(cardId)}`,
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
  const card = cards[cardId];

  if (!card) {
    return {};
  }

  return generateArticleMetadata({
    title: card.id,
    description: card.description,
    keywords: [card.id, '知识卡'],
    canonicalUrl: `https://tjwiki.com/cards/${encodeURIComponent(cardId)}`,
    imageUrl: card.imageUrl,
  });
}

// This page uses the KnowledgeCardDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const resolvedParams = await params;
  const cardId = decodeURIComponent(resolvedParams.cardId); // Decode the URL-encoded card ID
  const card = cards[cardId];

  if (!card) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(cardId)} />
      <KnowledgeCardDetailsClient card={card} />
    </>
  );
}
