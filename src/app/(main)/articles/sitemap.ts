import { MetadataRoute } from 'next';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { normalizeUrlWithTrailingSlash } from '@/lib/metadataUtils';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServerPublic } from '@/lib/supabase/public';
import { SITE_URL } from '@/constants/seo';
import { env } from '@/env';

export const revalidate = 3600;

function normalizeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    ...entry,
    url: normalizeUrlWithTrailingSlash(entry.url),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  if (env.NEXT_PUBLIC_DISABLE_ARTICLES === '1' || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return [];
  }

  const supabase =
    (supabaseAdmin as unknown as typeof supabaseAdmin | undefined) ??
    (supabaseServerPublic as unknown as typeof supabaseServerPublic | undefined);
  if (!supabase) return [];

  return cached(
    ['sitemap', 'articles'],
    async () => {
      const { data: articlesWithVersions } = await supabase
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

      return normalizeSitemapEntries(sitemap);
    },
    {
      revalidate: 3600,
      tags: [CACHE_TAGS.sitemapArticles, CACHE_TAGS.articles],
    }
  );
}
