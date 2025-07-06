import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { cards } from '@/data';
import KnowledgeCardDetailsClient from './KnowledgeCardDetailsClient';

export const dynamic = 'force-static';

// Generate static params for all cards
export function generateStaticParams() {
  return Object.keys(cards).map((cardId) => ({
    cardId: encodeURIComponent(cardId),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cardId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const decodedCardId = decodeURIComponent(resolvedParams.cardId);
  const card = cards[decodedCardId];

  if (!card) {
    return {};
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `${card.id} - 猫和老鼠手游wiki`,
    description: card.description,
    image: card.imageUrl,
  };

  return {
    title: `${card.id} - 猫和老鼠手游wiki`,
    description: card.description,
    keywords: [card.id, '知识卡', '猫和老鼠', '手游', '攻略'],
    openGraph: {
      title: `${card.id} - 猫和老鼠手游wiki`,
      description: card.description,
      images: [
        {
          url: card.imageUrl,
          alt: `${card.id}知识卡图标`,
        },
      ],
      type: 'article',
    },
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
}

// This page uses the KnowledgeCardDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default async function CardPage({ params }: { params: Promise<{ cardId: string }> }) {
  const resolvedParams = await params;
  const decodedCardId = decodeURIComponent(resolvedParams.cardId);
  const card = cards[decodedCardId];

  if (!card) {
    notFound();
  }

  return <KnowledgeCardDetailsClient card={card} />;
}
