import { MetadataRoute } from 'next';

import { CACHE_TAGS } from '@/lib/cacheTags';
import { normalizeUrlWithTrailingSlash } from '@/lib/metadataUtils';
import { cached } from '@/lib/serverCache';
import { supabaseAdmin } from '@/lib/supabase/admin';
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

  const supabase =
    (supabaseAdmin as unknown as typeof supabaseAdmin | undefined) ??
    (supabaseServerPublic as unknown as typeof supabaseServerPublic | undefined);
  if (!supabase) return [];

  return cached(
    ['sitemap', 'articles'],
    async () => {
      const { data: articlesWithVersions } = await supabase
        .from('articles')
        .select(
          'id, current_version:article_versions_public_view!articles_current_version_id_fkey(created_at)'
        )
        .not('current_version_id', 'is', null)
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
          const currentVersion = article.current_version as { created_at: string } | null;
          const lastModified = currentVersion?.created_at
            ? new Date(currentVersion.created_at)
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
