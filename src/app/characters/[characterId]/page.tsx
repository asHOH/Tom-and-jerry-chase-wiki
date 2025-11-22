import CharacterDetailsClient from '@/app/characters/[characterId]/CharacterDetailsClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { GameDataManager } from '@/lib/dataManager';
import { getTutorialPage } from '@/lib/docUtils';
import { generatePageMetadata } from '@/lib/metadataUtils';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import CharacterArticle from './CharacterArticle';
import CharacterDocs from './CharacterDocs';
import { Article, WithContext } from 'schema-dts';
import { characters } from '@/data';
import { getContentWritersByCharacter } from '@/constants';
import StructuredData from '@/components/StructuredData';

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
    headline: `${characterId} - 猫鼠wiki`,
    description: character.description,
    author,
    publisher: {
      '@type': 'Organization',
      name: '猫和老鼠手游wiki',
      url: 'https://tjwiki.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://tjwiki.com/characters/${encodeURIComponent(characterId)}`,
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
    canonicalUrl: `https://tjwiki.com/characters/${encodeURIComponent(characterId)}`,
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

    if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES) {
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
    }

    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const article = (
      docPage
        ? Promise.resolve(null)
        : supabaseAdmin
            .from('articles')
            .select('id')
            .in(
              'title',
              [characterId]
                .concat(character?.aliases ?? [])
                .flatMap((name) => [
                  `${name}攻略修复版`,
                  `${name}一武攻略修复版`,
                  `${name}二武攻略修复版`,
                  `萌新专区角色教学，${name}`,
                ])
            )
            .limit(1)
            .single()
    ).then((result) => result?.data ?? null);

    const articleContent = Promise.resolve(
      article.then((data) =>
        data
          ? supabaseAdmin
              .from('article_versions_public_view')
              .select('content')
              .eq('article_id', data.id)
              .eq('status', 'approved')
              .order('created_at', { ascending: false })
              .limit(1)
              .single()
              .then((result) => ({ content: result?.data?.content ?? null, id: data.id }))
          : null
      )
    );

    articleContent.then((result) =>
      result?.id
        ? supabaseAdmin.rpc('increment_article_view_count', { p_article_id: result.id })
        : null
    );

    return (
      <AppProvider>
        <EditModeProvider>
          <TabNavigationWrapper showDetailToggle={true}>
            <StructuredData data={generateStructuredData(characterId)} />
            <CharacterDetailsClient character={character}>
              {!!docPage ? (
                <CharacterDocs docPage={docPage}></CharacterDocs>
              ) : (
                <Suspense fallback={null}>
                  <CharacterArticle
                    content={articleContent}
                    authors={getContentWritersByCharacter(characterId)}
                  />
                </Suspense>
              )}
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
