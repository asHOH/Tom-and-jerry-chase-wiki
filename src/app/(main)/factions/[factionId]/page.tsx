import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CollectionPage, WithContext } from 'schema-dts';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_URL } from '@/constants/seo';
import StructuredData from '@/components/StructuredData';
import { factionData, factions } from '@/data';

import CharacterGridClient from './CharacterGridClient';

export const dynamic = 'force-static';

// Generate static params for all factions
export function generateStaticParams() {
  return Object.keys(factionData).map((factionId) => ({
    factionId,
  }));
}

function generateStructuredData(factionId: string): WithContext<CollectionPage> | null {
  const faction = factions[factionId];

  if (!faction) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${faction.name} - 猫鼠wiki`,
    description: faction.description,
    url: `${SITE_URL}/factions/${factionId}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: faction.characters.length,
      itemListElement: faction.characters.map((character, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: character.id,
        url: `${SITE_URL}/characters/${character.id}`,
      })),
    },
    inLanguage: 'zh-CN',
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ factionId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const faction = factions[resolvedParams.factionId];

  if (!faction) {
    return {};
  }

  return generatePageMetadata({
    title: faction.name,
    description: faction.description,
    keywords: [faction.name],
    canonicalUrl: `${SITE_URL}/factions/${resolvedParams.factionId}`,
  });
}

export default async function FactionPage({ params }: { params: Promise<{ factionId: string }> }) {
  const resolvedParams = await params;
  const faction = factions[resolvedParams.factionId];

  if (!faction) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(resolvedParams.factionId)} />
      <CharacterGridClient faction={faction} />
    </>
  );
}
