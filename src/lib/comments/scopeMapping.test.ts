import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';

import {
  getDiscussionCommentHref,
  resolveDiscussionNotificationTarget,
  resolveDiscussionTarget,
} from './scopeMapping';

jest.mock('server-only', () => ({}), { virtual: true });
jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedDomainReadModel: jest.fn(),
}));

const publishedData = {
  items: {
    __published_item__: { name: '已发布道具' },
  },
  specialSkills: {
    cat: { 测试特技: { name: '已发布特技' } },
    mouse: {},
  },
};

describe('discussion target resolution', () => {
  beforeEach(() => {
    jest.mocked(getPublishedDomainReadModel).mockImplementation(
      async (entityType) =>
        Promise.resolve({
          revision: 'v1:test',
          entityType,
          data: publishedData[entityType as keyof typeof publishedData] ?? {},
        }) as never
    );
  });

  it('resolves list discussions without loading a game-data domain', async () => {
    await expect(resolveDiscussionTarget(['items'])).resolves.toEqual({
      metadataTitle: '道具 - 讨论',
      scope: 'list_pages',
      targetId: 'items',
      entityTitle: '道具',
      entityTypeLabel: '道具',
      parentUrl: '/items/',
    });
    expect(getPublishedDomainReadModel).not.toHaveBeenCalled();
  });

  it('resolves detail discussions from the published read model', async () => {
    await expect(resolveDiscussionTarget(['items', '__published_item__'])).resolves.toEqual({
      metadataTitle: '已发布道具 (道具) - 讨论',
      scope: 'items',
      targetId: '__published_item__',
      entityTitle: '已发布道具',
      entityTypeLabel: '道具',
      parentUrl: '/items/__published_item__/',
    });
    expect(getPublishedDomainReadModel).toHaveBeenCalledWith('items');
  });

  it('normalizes faction-scoped route targets and links', async () => {
    await expect(resolveDiscussionTarget(['special-skills', 'cat', '测试特技'])).resolves.toEqual({
      metadataTitle: '已发布特技 (特技) - 讨论',
      scope: 'special_skills',
      targetId: 'cat.测试特技',
      entityTitle: '已发布特技',
      entityTypeLabel: '特技',
      parentUrl: '/special-skills/cat/%E6%B5%8B%E8%AF%95%E7%89%B9%E6%8A%80/',
    });

    await expect(
      resolveDiscussionNotificationTarget('special_skills', 'cat.测试特技')
    ).resolves.toEqual({
      entityTitle: '已发布特技',
      entityTypeLabel: '特技',
      href: '/discuss/special-skills/cat/%E6%B5%8B%E8%AF%95%E7%89%B9%E6%8A%80/',
    });
    expect(getDiscussionCommentHref('special_skills', 'cat/测试特技', 'comment-1')).toBe(
      '/discuss/special-skills/cat/%E6%B5%8B%E8%AF%95%E7%89%B9%E6%8A%80/#comment-comment-1'
    );
  });

  it('rejects unknown, malformed, and unpublished detail targets', async () => {
    await expect(resolveDiscussionTarget(['unknown'])).resolves.toBeNull();
    await expect(
      resolveDiscussionTarget(['special-skills', 'invalid', '测试特技'])
    ).resolves.toBeNull();
    await expect(resolveDiscussionTarget(['items', '__missing_item__'])).resolves.toBeNull();
  });
});
