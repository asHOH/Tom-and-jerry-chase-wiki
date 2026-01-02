export const CACHE_TAGS = {
  articles: 'articles',
  categories: 'categories',
  sitemapArticles: 'sitemap:articles',
  article: (articleId: string) => `article:${articleId}`,
  articleVersions: (articleId: string) => `article-versions:${articleId}`,
} as const;
