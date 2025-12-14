import { Metadata } from 'next';
import ArticlesClient from '@/features/articles/components/ArticlesClient';

import { generatePageMetadata } from '@/lib/metadataUtils';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const DESCRIPTION = '浏览其他爱好者的记录、思考和发现';

export const metadata: Metadata = generatePageMetadata({
  title: '文章列表 - 猫鼠wiki',
  description: DESCRIPTION,
  keywords: ['文章', '攻略', '猫和老鼠', '手游'],
  canonicalUrl: 'https://tjwiki.com/articles',
});

async function getArticles() {
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select(
      `
          id,
          title,
          created_at,
          view_count,
          author_id,
          category_id,
          categories (
            id,
            name
          ),
          users_public_view:author_id (
            nickname
          ),
          latest_approved_version:article_versions_public_view!inner (
            id,
            content,
            created_at,
            status,
            editor_id,
            users_public_view:editor_id (
              nickname
            )
          )
        `
    )
    .eq('article_versions_public_view.status', 'approved')
    .order('created_at');

  // Get categories for filter options
  const { data: categories, error: categoriesError } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .order('name');

  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
  }

  return {
    articles: articles || [],
    categories: categories || [],
  };
}

export default async function ArticlesPage() {
  return <ArticlesClient articles={await getArticles()} description={DESCRIPTION} />;
}
