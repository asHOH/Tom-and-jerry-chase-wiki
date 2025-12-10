import { MetadataRoute } from 'next';

import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tjwiki.com';

  if (process.env.NEXT_PUBLIC_DISABLE_ARTICLES || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  const { data: articlesWithVersions } = await supabaseAdmin
    .from('articles')
    .select('id, article_versions(created_at)')
    .order('created_at', { ascending: false });

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  if (articlesWithVersions) {
    articlesWithVersions.forEach((article) => {
      const versions = article.article_versions as { created_at: string }[] | null;
      const lastModified = versions?.length
        ? new Date(Math.max(...versions.map((v) => new Date(v.created_at).getTime())))
        : new Date();

      sitemap.push({
        url: `${baseUrl}/articles/${article.id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    });
  }

  return sitemap;
}
