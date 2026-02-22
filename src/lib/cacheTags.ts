import { revalidateTag, updateTag } from 'next/cache';

export const CACHE_TAGS = {
  articles: 'articles',
  categories: 'categories',
  sitemapArticles: 'sitemap:articles',
  article: (articleId: string) => `article:${articleId}`,
  articleVersions: (articleId: string) => `article-versions:${articleId}`,
} as const;

/**
 * Next.js 16 Granular Cache Invalidation patterns.
 *
 * @param tag The tag to invalidate
 * @param strategy 'nuke' (hard purge) or 'expire' (stale-while-revalidate / update)
 */
export async function invalidateCache(tag: string, strategy: 'nuke' | 'expire' = 'nuke') {
  if (strategy === 'expire') {
    // updateTag marks the tag as stale for revalidation in the background.
    try {
      updateTag(tag);
      return;
    } catch (err) {
      // Route Handlers cannot call updateTag; fall back to hard revalidation.
      console.warn('updateTag failed; falling back to revalidateTag', { tag, err });
    }
  }

  // revalidateTag('tag', 'max') purges the tag immediately.
  await revalidateTag(tag, 'max');
}
