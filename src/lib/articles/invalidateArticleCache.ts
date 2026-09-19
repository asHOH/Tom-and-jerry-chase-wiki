import 'server-only';

import { CACHE_TAGS, invalidateCache } from '@/lib/cacheTags';

/** Refresh only after the write commits. Cache failures must not invite a duplicate write. */
export function invalidateArticleCache({
  articleId,
  versionId,
  status,
}: {
  articleId: string;
  versionId: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
}): { warning?: 'cache_refresh_failed' } {
  const tags: Array<[string, 'immediate' | 'background']> = [];
  if (status === 'approved' || status === 'revoked') {
    tags.push(
      [CACHE_TAGS.article(articleId), 'immediate'],
      [CACHE_TAGS.articleVersions(articleId), 'immediate'],
      [CACHE_TAGS.sitemapArticles, status === 'revoked' ? 'immediate' : 'background']
    );
  }
  tags.push(
    [CACHE_TAGS.articles, status === 'revoked' ? 'immediate' : 'background'],
    [CACHE_TAGS.articlePreviews, 'immediate']
  );

  const failedTags: string[] = [];
  for (const [tag, mode] of tags) {
    try {
      invalidateCache(tag, mode);
    } catch (error) {
      failedTags.push(tag);
      console.error('Article cache refresh failed after commit:', {
        articleId,
        versionId,
        status,
        tag,
        error,
      });
    }
  }
  return failedTags.length ? { warning: 'cache_refresh_failed' } : {};
}
