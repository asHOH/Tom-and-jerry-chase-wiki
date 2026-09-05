import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CollectionPage, WithContext } from 'schema-dts';

import { GameDataManager } from '@/lib/dataManager';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { SITE_SHORT_NAME, SITE_URL } from '@/constants/seo';
import { factionData } from '@/data/static';
import type { FactionId } from '@/data/types';
import StructuredData from '@/components/StructuredData';

import CharacterGridClient from './CharacterGridClient';

export const dynamic = 'force-static';

// Generate static params for all factions
export function generateStaticParams() {
  return Object.keys(factionData).map((factionId) => ({
    factionId,
  }));
}

function generateStructuredData(
  factionId: string,
  faction: ReturnType<typeof GameDataManager.getFactionsWithCharacters>[string]
): WithContext<CollectionPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${faction.name} - ${SITE_SHORT_NAME}`,
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
  const characters = (await getPublishedDomainReadModel('characters')).data;
  const faction = GameDataManager.getFactionsWithCharacters(characters)[resolvedParams.factionId];

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
  const readModel = await getPublishedDomainReadModel('characters');
  const characters = readModel.data;
  const faction = GameDataManager.getFactionsWithCharacters(characters)[resolvedParams.factionId];

  if (!faction) {
    notFound();
  }

  return (
    <>
      <StructuredData data={generateStructuredData(resolvedParams.factionId, faction)} />
      <CharacterGridClient
        factionId={resolvedParams.factionId as FactionId}
        characters={characters}
        publishedRevision={readModel.revision}
      />
    </>
  );
}
