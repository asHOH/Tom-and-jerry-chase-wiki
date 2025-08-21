import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { factions, factionData } from '@/data';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import CharacterGridClient from './CharacterGridClient';
import { generatePageMetadata, CollectionPageStructuredData } from '@/lib/metadataUtils';

export const dynamic = 'force-static';

// Generate static params for all factions
export function generateStaticParams() {
  return Object.keys(factionData).map((factionId) => ({
    factionId,
  }));
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

  const structuredData: CollectionPageStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${faction.name} - 猫鼠wiki`,
    description: faction.description,
    url: `https://tjwiki.com/factions/${resolvedParams.factionId}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: faction.characters.length,
      itemListElement: faction.characters.map((character, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: character.id,
        url: `https://tjwiki.com/characters/${character.id}`,
      })),
    },
    inLanguage: 'zh-CN',
  };

  return generatePageMetadata({
    title: faction.name,
    description: faction.description,
    keywords: [faction.name],
    canonicalUrl: `https://tjwiki.com/factions/${resolvedParams.factionId}`,
    structuredData,
  });
}

export default async function FactionPage({ params }: { params: Promise<{ factionId: string }> }) {
  const resolvedParams = await params;
  const faction = factions[resolvedParams.factionId];

  if (!faction) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <TabNavigationWrapper showDetailToggle={false}>
          <CharacterGridClient faction={faction} />
        </TabNavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
