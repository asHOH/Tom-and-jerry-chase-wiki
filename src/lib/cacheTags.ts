import { revalidateTag } from 'next/cache';

import { invalidateCacheAcquisitions } from '@/lib/serverCache';

export const CACHE_TAGS = {
  articles: 'articles',
  articlePreviews: 'article-previews',
  categories: 'categories',
  users: 'users',
  sitemapArticles: 'sitemap:articles',
  article: (articleId: string) => `article:${articleId}`,
  articleVersions: (articleId: string) => `article-versions:${articleId}`,
} as const;

/** Immediate expiration blocks the next read; background refresh may serve stale data. */
export function invalidateCache(tag: string, mode: 'immediate' | 'background'): void {
  if (mode === 'immediate') invalidateCacheAcquisitions(tag);
  revalidateTag(tag, mode === 'immediate' ? { expire: 0 } : 'max');
}
