import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { characters } from '@/data';
import CharacterDetailsClient from '@/app/characters/[characterId]/CharacterDetailsClient';
import NavigationWrapper from '@/components/NavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';

// Allow dynamic rendering for new character IDs created in edit mode
export const dynamic = 'force-dynamic';

// Generate static params for all characters
export function generateStaticParams() {
  return Object.keys(characters).map((characterId) => ({
    characterId: characterId, // Don't encode here - Next.js will handle it
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ characterId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const characterId = decodeURIComponent(resolvedParams.characterId); // Decode the URL-encoded character ID
  const character = characters[characterId];

  if (!character) {
    return {};
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${character.id} - 猫和老鼠手游wiki`,
    description: `${character.id}详细信息 - 属性、技能、加点、知识卡推荐`,
    author: {
      '@type': 'Organization',
      name: '猫和老鼠手游wiki',
    },
    publisher: {
      '@type': 'Organization',
      name: '猫和老鼠手游wiki',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tom-and-jerry-chase-wiki.space/characters/${encodeURIComponent(characterId)}`,
    },
    inLanguage: 'zh-CN',
  };

  return {
    alternates: {
      canonical: `https://tom-and-jerry-chase-wiki.space/characters/${encodeURIComponent(characterId)}`,
    },
    other: {
      'application/ld+json': JSON.stringify(structuredData),
    },
  };
}

// This page uses the CharacterDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const resolvedParams = await params;
  const characterId = decodeURIComponent(resolvedParams.characterId); // Decode the URL-encoded character ID
  const character = characters[characterId];

  if (!character) {
    notFound();
  }

  return (
    <AppProvider>
      <EditModeProvider>
        <NavigationWrapper showDetailToggle={true}>
          <CharacterDetailsClient character={character} />
        </NavigationWrapper>
      </EditModeProvider>
    </AppProvider>
  );
}
