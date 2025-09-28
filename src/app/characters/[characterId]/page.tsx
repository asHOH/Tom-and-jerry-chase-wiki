import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { GameDataManager } from '@/lib/dataManager';
import CharacterDetailsClient from '@/app/characters/[characterId]/CharacterDetailsClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { generatePageMetadata, ArticleStructuredData } from '@/lib/metadataUtils';
import CharacterDocs from './CharacterDocs';
import { getTutorialPage } from '@/lib/docUtils';

// Revalidate once per 8 hours to keep docs fresh
export const revalidate = 28800;

const getCharacterMap = () => {
  if (process.env.NODE_ENV !== 'production') {
    GameDataManager.invalidate({ characters: true, factions: true });
  }

  return GameDataManager.getCharacters();
};

// Generate static params for all characters
export function generateStaticParams() {
  const characterMap = getCharacterMap();
  return Object.keys(characterMap).map((id) => ({ characterId: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ characterId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const characterId = decodeURIComponent(resolvedParams.characterId); // Decode the URL-encoded character ID
  const characterMap = getCharacterMap();
  const character = characterMap[characterId];

  if (!character) {
    return {};
  }

  const structuredData: ArticleStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${character.id} - 猫鼠wiki`,
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
      '@id': `https://tjwiki.com/characters/${encodeURIComponent(characterId)}`,
    },
    inLanguage: 'zh-CN',
  };

  return generatePageMetadata({
    title: character.id,
    description: `${character.id}详细信息 - 属性、技能、加点、知识卡推荐`,
    keywords: [character.id],
    canonicalUrl: `https://tjwiki.com/characters/${encodeURIComponent(characterId)}`,
    structuredData,
  });
}

// This page uses the CharacterDetails component to avoid code duplication
// The component handles both SPA navigation and direct URL access

export default async function CharacterPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  try {
    const resolvedParams = await params;
    const characterId = decodeURIComponent(resolvedParams.characterId); // Decode the URL-encoded character ID
    const characterMap = getCharacterMap();
    const character = characterMap[characterId];
    const docPage = await getTutorialPage(characterId);

    if (!character) {
      notFound();
    }

    return (
      <AppProvider>
        <EditModeProvider>
          <TabNavigationWrapper showDetailToggle={true}>
            <CharacterDetailsClient character={character}>
              {!!docPage ? <CharacterDocs docPage={docPage}></CharacterDocs> : null}
            </CharacterDetailsClient>
          </TabNavigationWrapper>
        </EditModeProvider>
      </AppProvider>
    );
  } catch (error) {
    console.error('Error rendering character page:', error);
    notFound();
  }
}
