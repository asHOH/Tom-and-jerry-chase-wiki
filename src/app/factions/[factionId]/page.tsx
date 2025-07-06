import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { factions, factionData } from '@/data';
import NavigationWrapper from '@/components/NavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import CharacterGridClient from './CharacterGridClient';

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

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${faction.name} - 猫和老鼠手游wiki`,
    description: faction.description,
    url: `https://tom-and-jerry-chase-wiki.space/factions/${resolvedParams.factionId}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: faction.characters.length,
      itemListElement: faction.characters.map((character, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: character.id,
        url: `https://tom-and-jerry-chase-wiki.space/characters/${character.id}`,
      })),
    },
    inLanguage: 'zh-CN',
  };

  return {
    alternates: {
      canonical: `https://tom-and-jerry-chase-wiki.space/factions/${resolvedParams.factionId}`,
    },
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
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
        <NavigationWrapper showDetailToggle={false}>
          <CharacterGridClient faction={faction} />
        </NavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
