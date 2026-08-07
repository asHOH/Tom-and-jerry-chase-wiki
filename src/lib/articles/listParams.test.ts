import {
  ARTICLE_LIST_PAGE_SIZE,
  buildArticleListHref,
  normalizeArticleListParams,
} from './listParams';

const CATEGORY_A = '11111111-1111-4111-8111-111111111111';
const CATEGORY_B = '22222222-2222-4222-8222-222222222222';

describe('article list parameters', () => {
  it('uses fixed safe defaults', () => {
    expect(ARTICLE_LIST_PAGE_SIZE).toBe(18);
    expect(normalizeArticleListParams({})).toEqual({
      page: 1,
      categoryIds: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  });

  it.each(['-1', '0', '1.5', 'NaN', '9007199254740992'])(
    'normalizes invalid page %s to the first page',
    (page) => {
      expect(normalizeArticleListParams({ page }).page).toBe(1);
    }
  );

  it('caps excessive pages and rejects arbitrary sorting', () => {
    expect(
      normalizeArticleListParams({ page: '999999', sort: 'author_id', order: 'sideways' })
    ).toMatchObject({ page: 10_000, sortBy: 'created_at', sortOrder: 'desc' });
  });

  it('deduplicates, validates, and canonicalizes category IDs', () => {
    expect(
      normalizeArticleListParams({
        category: `${CATEGORY_B},invalid,${CATEGORY_A},${CATEGORY_B}`,
      }).categoryIds
    ).toEqual([CATEGORY_A, CATEGORY_B]);
  });

  it('builds a canonical URL and omits default values', () => {
    expect(
      buildArticleListHref({
        page: 2,
        categoryIds: [CATEGORY_B, CATEGORY_A, CATEGORY_B],
        sortBy: 'title',
        sortOrder: 'asc',
      })
    ).toBe(`/articles?page=2&category=${CATEGORY_A}%2C${CATEGORY_B}&sort=title&order=asc`);
    expect(
      buildArticleListHref({
        page: 1,
        categoryIds: [],
        sortBy: 'created_at',
        sortOrder: 'desc',
      })
    ).toBe('/articles');
  });
});
