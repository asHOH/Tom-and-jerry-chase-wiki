import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import { GameDataManager } from '@/lib/dataManager';
import { generatePageMetadata } from '@/lib/metadataUtils';
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

    if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return (
        <CharacterDetailsClient character={character}>
          {!!docPage ? <CharacterDocs docPage={docPage}></CharacterDocs> : null}
        </CharacterDetailsClient>
      );
    }

    const { supabaseAdmin } = await import('@/lib/supabase/admin');

    type CharacterArticleMetaRow = {
      id: string;
      title: string;
      users_public_view: { nickname: string | null } | null;
    };

    type CharacterArticleVersionRow = {
      article_id: string | null;
      content: string | null;
      created_at: string | null;
    };

    const articles = docPage
      ? Promise.resolve([] as CharacterArticleMetaRow[])
      : supabaseAdmin
          .from('articles')
          .select('id, title, users_public_view!author_id(nickname)')
          .eq('character_id', characterId)
          .order('created_at', { ascending: false })
          .then((result) => (result?.data ?? []) as CharacterArticleMetaRow[]);

    const articleContent = Promise.resolve(
      articles.then(async (items) => {
        if (!items || items.length === 0) {
          return [];
        }

        const articleIds = items.map((item) => item.id);

        const { data: versions } = await supabaseAdmin
          .from('article_versions_public_view')
          .select('article_id, content, created_at')
          .in('article_id', articleIds)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        const latestByArticleId = new Map<
          string,
          {
            content: string | null;
          }
        >();

        for (const version of (versions ?? []) as CharacterArticleVersionRow[]) {
          if (!version.article_id) continue;
          if (!latestByArticleId.has(version.article_id)) {
            latestByArticleId.set(version.article_id, {
              content: version.content ?? null,
            });
          }
        }

        return items
          .map((item) => {
            const latest = latestByArticleId.get(item.id);
            const authorNickname =
              (item.users_public_view as { nickname: string | null } | null)?.nickname ?? null;
            const authors = authorNickname ? [authorNickname] : [];

            return {
              id: item.id,
              title: item.title,
              content: latest?.content ?? null,
              authors,
            };
          })
          .filter((item) => Boolean(item.content));
      })
    );

    // Keep existing behavior: the first visible embedded article counts as a view.
    articleContent.then((result) =>
      result?.[0]?.id
        ? supabaseAdmin.rpc('increment_article_view_count', { p_article_id: result[0].id })
        : null
    );

    return (
      <>
        <StructuredData data={generateStructuredData(characterId)} />
        <CharacterDetailsClient character={character}>
          {!!docPage ? (
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
