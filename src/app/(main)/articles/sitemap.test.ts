import { supabaseServerPublic } from '@/lib/supabase/public';
import { getOptionalSupabasePublicClient } from '@/lib/supabase/publicClient';

import sitemap from './sitemap';

jest.mock('@/lib/cacheTags', () => ({
  CACHE_TAGS: {
    articles: 'articles',
    sitemapArticles: 'sitemap:articles',
  },
}));

jest.mock('@/lib/serverCache', () => ({
  cached: (
    _keyParts: Array<string | number | boolean | null | undefined>,
    fn: () => Promise<unknown>
  ) => fn(),
}));

jest.mock('@/lib/supabase/public', () => ({
  supabaseServerPublic: { from: jest.fn() },
}));

jest.mock('@/lib/supabase/publicClient', () => ({
  getOptionalSupabasePublicClient: jest.fn(),
}));

jest.mock('@/constants/seo', () => ({
  SITE_URL: 'https://tjwiki.test',
}));

const getOptionalSupabasePublicClientMock = jest.mocked(getOptionalSupabasePublicClient);
const publicFromMock = jest.mocked(supabaseServerPublic!.from);

const query = {
  select: jest.fn(),
  not: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
};

describe('article sitemap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getOptionalSupabasePublicClientMock.mockReturnValue(supabaseServerPublic);
    query.select.mockReturnValue(query);
    query.not.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    publicFromMock.mockReturnValue(query as never);
  });

  it('queries only approved current versions through the public client', async () => {
    query.order.mockResolvedValue({
      data: [
        {
          id: 'published-article',
          current_version: {
            created_at: '2026-08-01T12:00:00.000Z',
            status: 'approved',
          },
        },
      ],
      error: null,
    });

    const result = await sitemap();

    expect(publicFromMock).toHaveBeenCalledWith('articles');
    expect(query.select).toHaveBeenCalledWith(
      'id, current_version:article_versions_public_view!articles_current_version_id_fkey!inner(created_at, status)'
    );
    expect(query.not).toHaveBeenCalledWith('current_version_id', 'is', null);
    expect(query.eq).toHaveBeenCalledWith('current_version.status', 'approved');
    expect(result).toContainEqual({
      url: 'https://tjwiki.test/articles/published-article/',
      lastModified: new Date('2026-08-01T12:00:00.000Z'),
      changeFrequency: 'weekly',
      priority: 0.5,
    });
  });

  it('omits rows without a usable approved current version', async () => {
    query.order.mockResolvedValue({
      data: [
        { id: 'missing-version', current_version: null },
        {
          id: 'rejected-version',
          current_version: {
            created_at: '2026-08-02T12:00:00.000Z',
            status: 'rejected',
          },
        },
        {
          id: 'missing-date',
          current_version: { created_at: null, status: 'approved' },
        },
        {
          id: 'invalid-date',
          current_version: { created_at: 'not-a-date', status: 'approved' },
        },
      ],
      error: null,
    });

    const result = await sitemap();

    expect(result).toHaveLength(1);
    expect(result[0]?.url).toBe('https://tjwiki.test/articles/');
  });

  it('returns no sitemap entries when public Supabase is disabled', async () => {
    getOptionalSupabasePublicClientMock.mockReturnValue(undefined);

    await expect(sitemap()).resolves.toEqual([]);
    expect(publicFromMock).not.toHaveBeenCalled();
  });
});
