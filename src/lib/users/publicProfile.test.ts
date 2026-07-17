import { mergeRecentContributions } from './publicProfile';

describe('mergeRecentContributions', () => {
  it('merges both contribution sources in reverse chronological order', () => {
    expect(
      mergeRecentContributions(
        [
          {
            id: 'article-version',
            article_id: 'article',
            commit_message: '补充说明',
            created_at: '2026-07-16T08:00:00Z',
            articles: { title: '测试文章' },
          },
        ],
        [
          {
            id: 'game-data-action',
            entity_type: 'characters',
            message: '修正数值',
            created_at: '2026-07-17T08:00:00Z',
          },
        ]
      )
    ).toEqual([
      {
        id: 'game-data-action',
        kind: 'gameData',
        title: '更新角色',
        description: '修正数值',
        href: null,
        createdAt: '2026-07-17T08:00:00Z',
      },
      {
        id: 'article-version',
        kind: 'article',
        title: '编辑《测试文章》',
        description: '补充说明',
        href: '/articles/article/history',
        createdAt: '2026-07-16T08:00:00Z',
      },
    ]);
  });

  it('applies the requested limit', () => {
    const rows = Array.from({ length: 3 }, (_, index) => ({
      id: `action-${index}`,
      entity_type: 'unknown',
      message: null,
      created_at: `2026-07-1${index + 1}T08:00:00Z`,
    }));

    expect(mergeRecentContributions([], rows, 2)).toHaveLength(2);
  });
});
