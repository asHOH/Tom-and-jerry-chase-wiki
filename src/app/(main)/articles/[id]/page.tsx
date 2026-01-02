import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

import { getApprovedArticleVersion, getArticleBasicInfo } from '@/lib/articles/serverQueries';
import { generateArticleMetadata } from '@/lib/metadataUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';
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
    publisher: { '@type': 'Organization', name: '猫和老鼠手游wiki', url: 'https://tjwiki.com' },
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

  const canonicalUrl = `https://tjwiki.com/articles/${id}`;

  return generateArticleMetadata({
    title: `${article.title} - 猫鼠wiki`,
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
  let response;

  try {
    // Increment view count
    const adminClient = supabaseAdmin as unknown as typeof supabaseAdmin | undefined;
    if (adminClient) {
      const { error: incrementError } = await adminClient.rpc('increment_article_view_count', {
        p_article_id: id,
      });

      if (incrementError) {
        // Log the error but don't block the request
        console.error('Error incrementing view count:', incrementError);
      }
    }

    // Get the article basic info
    const article = await getArticleBasicInfo(id);

    if (!article) {
      notFound();
    }

    // Get the latest approved version with editor info
    const latestVersion = await getApprovedArticleVersion({
      articleId: id,
      ...(version ? { versionId: version } : {}),
    });

    if (!latestVersion) {
      notFound();
    }

    // Combine the data
    response = {
      article: {
        ...article,
        latest_version: latestVersion,
      },
    };
  } catch (err) {
    console.error('API error:', err);
    notFound();
  }

  return (
    <>
      <StructuredData
        data={buildArticleStructuredData({
          title: response.article.title,
          author: response.article.users_public_view?.nickname || '匿名',
          description:
            stripHtml(response.article.latest_version?.content ?? null).substring(0, 150) ||
            response.article.title,
          canonicalUrl: `https://tjwiki.com/articles/${id}`,
          dateModified: response.article.latest_version?.created_at ?? response.article.created_at,
          datePublished: response.article.created_at,
        })}
      />
      <ArticleClient article={response.article} />
    </>
  );
}
