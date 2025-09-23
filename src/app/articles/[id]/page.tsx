import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateArticleMetadata, buildArticleStructuredData } from '@/lib/metadataUtils';
import ArticleClient from './ArticleClient';
import TabNavigationWrapper from '@/components/TabNavigationWrapper';
import { AppProvider } from '@/context/AppContext';
import { EditModeProvider } from '@/context/EditModeContext';
import { notFound } from 'next/navigation';

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

  const stripHtml = (html: string | null) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '');
  };

  const description = stripHtml(latestVersion!.content).substring(0, 150) || article.title;

  const canonicalUrl = `https://tjwiki.com/articles/${id}`;

  return generateArticleMetadata({
    title: `${article.title} - 猫鼠wiki`,
    description: description,
    keywords: ['文章', article.title],
    canonicalUrl,
    structuredData: buildArticleStructuredData({
      title: article.title,
      description: description,
      canonicalUrl,
    }),
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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
    const { data: latestVersion, error: versionError } = await supabaseAdmin
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
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (versionError) {
      console.error('Error fetching latest version:', versionError);
      notFound();
    }

    // Combine the data
    const response = {
      article: {
        ...article,
        latest_version: latestVersion,
      },
    };

    return (
      <AppProvider>
        <EditModeProvider>
          <TabNavigationWrapper showDetailToggle={false}>
            <ArticleClient article={response.article} />
          </TabNavigationWrapper>
        </EditModeProvider>
      </AppProvider>
    );
  } catch (err) {
    console.error('API error:', err);
    notFound();
  }
}
