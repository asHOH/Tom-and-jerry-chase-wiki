import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import {
  getApprovedArticleVersion,
  getArticleBasicInfo,
  incrementArticleViewCount,
} from '@/lib/articles/serverQueries';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { generateArticleMetadata, getCanonicalUrl } from '@/lib/metadataUtils';
import { sanitizeHTML } from '@/lib/xssUtils';
import { SITE_NAME, SITE_URL } from '@/constants/seo';
import StructuredData from '@/components/StructuredData';

import ArticleClient from './ArticleClient';

const stripHtml = (html: string | null) => {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
};
function buildArticleStructuredData({
  title,
  description,
  author,
  dateModified,
  datePublished,
  canonicalUrl,
  inLanguage = 'zh-CN',
}: {
  title: string;
  description: string;
  author: string;
  dateModified: string;
  datePublished: string;
  canonicalUrl: string;
  inLanguage?: string;
}): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    author: { '@type': 'Person', name: author },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    dateModified,
    datePublished,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    inLanguage,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const article = await getArticleBasicInfo(id);

  if (!article) {
    return {};
  }

  const latestVersion = await getApprovedArticleVersion({ articleId: id });
  const description = stripHtml(latestVersion?.content ?? null).substring(0, 150) || article.title;

  const canonicalUrl = getCanonicalUrl(`/articles/${id}`);

  return generateArticleMetadata({
    title: article.title,
    description: description,
    keywords: ['文章', article.title],
    canonicalUrl,
  });
}

export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ version?: string }>;
}) {
  const { id } = await params;
  const { version } = await searchParams;
  await incrementArticleViewCount(id);
  const basicInfo = await getArticleBasicInfo(id);
  if (!basicInfo) notFound();

  const latestVersion = await getApprovedArticleVersion({
    articleId: id,
    ...(version ? { versionId: version } : {}),
  });
  if (!latestVersion) notFound();

  const article = { ...basicInfo, latest_version: latestVersion };

  const sanitizedContent = sanitizeHTML(article.latest_version?.content ?? '');
  const publishedCharacter = article.character_id
    ? (await getPublishedEntityRouteReadModel('characters', article.character_id)).data
    : null;
  const boundCharacter = publishedCharacter
    ? {
        id: publishedCharacter.id,
        ...(publishedCharacter.factionId ? { factionId: publishedCharacter.factionId } : {}),
      }
    : null;

  return (
    <>
      <StructuredData
        data={buildArticleStructuredData({
          title: article.title,
          author: article.users_public_view?.nickname || '匿名',
          description:
            stripHtml(article.latest_version?.content ?? null).substring(0, 150) || article.title,
          canonicalUrl: getCanonicalUrl(`/articles/${id}`),
          dateModified: article.latest_version?.created_at ?? article.created_at,
          datePublished: article.created_at,
        })}
      />
      <ArticleClient
        article={article}
        boundCharacter={boundCharacter}
        sanitizedContent={sanitizedContent}
      />
    </>
  );
}
