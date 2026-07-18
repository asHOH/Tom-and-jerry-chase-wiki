import {
  mapGameDataChange,
  mergeRecentChangeRows,
  normalizeRecentChangesFilter,
  normalizeRecentChangesPage,
  RECENT_CHANGES_MAX_ITEMS,
  RECENT_CHANGES_PAGE_SIZE,
} from './recentChanges';

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  unstable_cache: (callback: unknown) => callback,
  updateTag: jest.fn(),
}));

describe('recent changes', () => {
  it('normalizes filters and positive page numbers', () => {
    expect(normalizeRecentChangesFilter('articles')).toBe('articles');
    expect(normalizeRecentChangesFilter('unexpected')).toBe('all');
    expect(normalizeRecentChangesPage('3')).toBe(3);
    expect(normalizeRecentChangesPage('-1')).toBe(1);
    expect(normalizeRecentChangesPage('abc')).toBe(1);
  });

  it('limits the recent-changes feed to five pages and 100 entries', () => {
    expect(RECENT_CHANGES_MAX_ITEMS).toBe(100);
    expect(RECENT_CHANGES_MAX_ITEMS / RECENT_CHANGES_PAGE_SIZE).toBe(5);
  });

  it('describes affected game-data entries and links to the first one', () => {
    expect(
      mapGameDataChange({
        id: 'game-1',
        entity_type: 'characters',
        entry: [
          { op: 'set', path: '汤姆.description', value: '更新' },
          { op: 'set', path: '杰瑞.description', value: '更新' },
        ],
        message: '调整角色介绍',
        created_at: '2026-07-18T08:00:00Z',
        created_by: 'user-1',
        users: { nickname: '编辑者' },
      })
    ).toMatchObject({
      title: '更新角色：汤姆、杰瑞',
      description: '调整角色介绍',
      href: '/characters/%E6%B1%A4%E5%A7%86',
      editor: { id: 'user-1', nickname: '编辑者' },
    });
  });

  it('merges both sources by timestamp before slicing the requested window', () => {
    const changes = mergeRecentChangeRows(
      [
        {
          id: 'article-1',
          article_id: 'guide',
          commit_message: null,
          created_at: '2026-07-18T09:00:00Z',
          editor_id: 'user-1',
          articles: { title: '攻略' },
          users: { nickname: '甲' },
        },
      ],
      [
        {
          id: 'game-1',
          entity_type: 'items',
          entry: { op: 'set', path: '奶酪.description', value: '更新' },
          message: null,
          created_at: '2026-07-18T10:00:00Z',
          created_by: null,
          users: null,
        },
      ],
      1,
      1
    );

    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ id: 'article-1', kind: 'article' });
  });
});
