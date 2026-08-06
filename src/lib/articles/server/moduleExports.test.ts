import { getEmbeddedArticlesForCharacter } from './characterArticleQueries';
import {
  getApprovedArticleVersion,
  getArticleBasicInfo,
  getArticleDetailData,
  getArticleHistory,
  incrementArticleViewCount,
} from './detailQueries';
import { getArticleListPage, getArticlesPageData } from './listQueries';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/serverCache', () => ({
  cached: (
    _keyParts: Array<string | number | boolean | null | undefined>,
    fn: () => Promise<unknown>
  ) => fn(),
}));

jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: {
    articles: 'articles',
    categories: 'categories',
    article: (articleId: string) => `article:${articleId}`,
    articleVersions: (articleId: string) => `article-versions:${articleId}`,
  },
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: undefined,
}));

jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: undefined,
}));

describe('article server query modules', () => {
  it('should expose focused internal modules behind the public facade', () => {
    expect(typeof getArticlesPageData).toBe('function');
    expect(typeof getArticleListPage).toBe('function');
    expect(typeof getArticleBasicInfo).toBe('function');
    expect(typeof getApprovedArticleVersion).toBe('function');
    expect(typeof getArticleDetailData).toBe('function');
    expect(typeof getArticleHistory).toBe('function');
    expect(typeof incrementArticleViewCount).toBe('function');
    expect(typeof getEmbeddedArticlesForCharacter).toBe('function');
  });
});
