import { revalidateTag } from 'next/cache';

import { invalidateArticleCache } from './invalidateArticleCache';

jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));

const immediate = { expire: 0 };

it.each([
  [
    'approved',
    [
      ['article:a', immediate],
      ['article-versions:a', immediate],
      ['sitemap:articles', 'max'],
      ['articles', 'max'],
      ['article-previews', immediate],
    ],
  ],
  [
    'revoked',
    [
      ['article:a', immediate],
      ['article-versions:a', immediate],
      ['sitemap:articles', immediate],
      ['articles', immediate],
      ['article-previews', immediate],
    ],
  ],
  [
    'pending',
    [
      ['articles', 'max'],
      ['article-previews', immediate],
    ],
  ],
  [
    'rejected',
    [
      ['articles', 'max'],
      ['article-previews', immediate],
    ],
  ],
] as const)('applies the exact %s cache policy', (status, expected) => {
  expect(invalidateArticleCache({ articleId: 'a', versionId: 'v', status })).toEqual({});
  expect(jest.mocked(revalidateTag).mock.calls).toEqual(expected);
});

it('attempts remaining tags and returns a committed-write warning after a cache failure', () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(revalidateTag).mockImplementationOnce(() => {
    throw new Error('cache unavailable');
  });
  expect(invalidateArticleCache({ articleId: 'a', versionId: 'v', status: 'approved' })).toEqual({
    warning: 'cache_refresh_failed',
  });
  expect(revalidateTag).toHaveBeenCalledTimes(5);
  expect(revalidateTag).toHaveBeenLastCalledWith('article-previews', immediate);
  expect(log).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      articleId: 'a',
      versionId: 'v',
      status: 'approved',
      tag: 'article:a',
    })
  );
});
