import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Article, WithContext } from 'schema-dts';

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

  const { data: article } = await supabaseAdmin
    .from('articles')
    .select('id, title')
    .eq('id', id)
    .single();

  if (!article) {
    return {};
  }

  const { data: latestVersion } = await supabaseAdmin
    .from('article_versions_public_view')
    .select('content')
    .eq('article_id', id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const description = stripHtml(latestVersion!.content).substring(0, 150) || article.title;

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
    const { error: incrementError } = await supabaseAdmin.rpc('increment_article_view_count', {
      p_article_id: id,
    });

    if (incrementError) {
      // Log the error but don't block the request
      console.error('Error incrementing view count:', incrementError);
    }

    // Get the article basic info
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select(
        `
          id,
          title,
          category_id,
          author_id,
          created_at,
          view_count,
          character_id,
          categories(name),
          users_public_view!author_id(nickname)
        `
      )
      .eq('id', id)
      .single();

    if (articleError) {
      console.error('Error fetching article:', articleError);
      notFound();
    }

    // Get the latest approved version with editor info
    let query = supabaseAdmin
      .from('article_versions_public_view')
      .select(
        `
          id, 
          content, 
          created_at, 
          editor_id,
          users_public_view!editor_id(nickname)
        `
      )
      .eq('article_id', id)
      .eq('status', 'approved');

    if (version) {
      query = query.eq('id', version);
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: latestVersion, error: versionError } = await query.limit(1).single();

    if (versionError) {
      console.error('Error fetching latest version:', versionError);
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
          author: response.article.users_public_view.nickname!,
          description:
            stripHtml(response.article.latest_version!.content).substring(0, 150) ||
            response.article.title,
          canonicalUrl: `https://tjwiki.com/articles/${id}`,
          dateModified: response.article.latest_version!.created_at!,
          datePublished: response.article.created_at,
        })}
      />
      <ArticleClient article={response.article} />
    </>
  );
}
