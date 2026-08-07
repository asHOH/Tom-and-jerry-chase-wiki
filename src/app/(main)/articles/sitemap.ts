import { MetadataRoute } from 'next';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { normalizeUrlWithTrailingSlash } from '@/lib/metadataUtils';
import { cached } from '@/lib/serverCache';
import { hasSupabasePublicConfig } from '@/lib/supabase/config';
import { supabaseServerPublic } from '@/lib/supabase/public';
import { SITE_URL } from '@/constants/seo';

export const revalidate = 3600;

function normalizeSitemapEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
  return entries.map((entry) => ({
    ...entry,
    url: normalizeUrlWithTrailingSlash(entry.url),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  if (!hasSupabasePublicConfig()) {
    return [];
  }

  const supabase = supabaseServerPublic as typeof supabaseServerPublic | undefined;
  if (!supabase) return [];

  return cached(
    ['sitemap', 'articles'],
    async () => {
      const { data: articlesWithVersions } = await supabase
        .from('articles')
        .select(
          'id, current_version:article_versions_public_view!articles_current_version_id_fkey!inner(created_at, status)'
        )
        .not('current_version_id', 'is', null)
        .eq('current_version.status', 'approved')
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
          const currentVersion = article.current_version as {
            created_at: string | null;
            status: string | null;
          } | null;
          if (currentVersion?.status !== 'approved' || !currentVersion.created_at) return;

          const lastModified = new Date(currentVersion.created_at);
          if (Number.isNaN(lastModified.getTime())) return;

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
