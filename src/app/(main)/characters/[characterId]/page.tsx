import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import {
  getEmbeddedArticlesForCharacter,
  incrementArticleViewCount,
} from '@/lib/articles/serverQueries';
import { GameDataManager } from '@/lib/dataManager';
import { generatePageMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { SITE_URL } from '@/constants/seo';
import { getTutorialPage } from '@/features/articles/utils/docs';
import StructuredData from '@/components/StructuredData';
import CharacterDetailsClient from '@/app/(main)/characters/[characterId]/CharacterDetailsClient';
import { getContentWritersByCharacter } from '@/constants';
import { characters } from '@/data';

import CharacterArticle from './CharacterArticle';
import CharacterDocs from './CharacterDocs';

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

function generateStructuredData(characterId: string): WithContext<Article> | null {
  const character = characters[characterId];
  const author = getContentWritersByCharacter(characterId).map((author) => ({
    '@type': 'Person' as const,
    name: author,
  }));
  if (!character) {
    return null;
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: characterId,
    description: character.description,
    author,
    publisher: {
      '@type': 'Organization',
      name: '猫和老鼠手游wiki',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/characters/${encodeURIComponent(characterId)}`,
    },
    inLanguage: 'zh-CN',
    image: character.imageUrl,
  };
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

  return generatePageMetadata({
    title: character.id,
    description: character.description,
    keywords: [character.id],
    canonicalUrl: getCanonicalUrl(`/characters/${encodeURIComponent(characterId)}`),
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

    if (!hasSupabasePublicConfig()) {
      return (
        <CharacterDetailsClient character={character}>
          {docPage ? <CharacterDocs docPage={docPage}></CharacterDocs> : null}
        </CharacterDetailsClient>
      );
    }

    const articleContent = docPage
      ? Promise.resolve([])
      : getEmbeddedArticlesForCharacter(characterId);

    // Keep existing behavior: the first visible embedded article counts as a view.
    articleContent.then((result) =>
      result?.[0]?.id ? incrementArticleViewCount(result[0].id) : null
    );

    return (
      <>
        <StructuredData data={generateStructuredData(characterId)} />
        <CharacterDetailsClient character={character}>
          {docPage ? (
            <CharacterDocs docPage={docPage}></CharacterDocs>
          ) : (
            <Suspense fallback={null}>
              <CharacterArticle content={articleContent} />
            </Suspense>
          )}
        </CharacterDetailsClient>
      </>
    );
  } catch (error) {
    console.error('Error rendering character page:', error);
    notFound();
  }
}
