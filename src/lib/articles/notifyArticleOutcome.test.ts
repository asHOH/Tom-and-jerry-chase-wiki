import { notifyArticleVersionSubscribers, publishNotification } from '@/lib/notificationUtils';
import { getPublicUserSubmissionHref } from '@/lib/users/publicProfile';

import { notifyArticleOutcome } from './notifyArticleOutcome';

jest.mock('@/lib/notificationUtils', () => ({
  notifyArticleVersionSubscribers: jest.fn(),
  publishNotification: jest.fn(),
}));
jest.mock('@/lib/users/publicProfile', () => ({ getPublicUserSubmissionHref: jest.fn() }));

const base = { articleId: 'a', versionId: 'v', userId: 'u', title: '攻略' };
beforeEach(() => {
  jest.resetAllMocks();
});

it.each([
  ['create', 'approved', '文章已自动通过审核', '您的文章《攻略》已自动通过审核并发布。'],
  ['create', 'rejected', '文章未通过审核', '您的文章《攻略》未通过自动审核。'],
  ['edit', 'approved', '文章修改已自动通过审核', '您对《攻略》的修改已自动通过审核并发布。'],
  ['edit', 'rejected', '文章修改未通过审核', '您对《攻略》的修改未通过自动审核。'],
] as const)('preserves %s %s notifications', async (source, status, title, body) => {
  await notifyArticleOutcome({ ...base, source, status, categoryId: 'c' });
  expect(publishNotification).toHaveBeenCalledWith({
    recipientUserId: 'u',
    kind: `article_version_${status}`,
    decisionOrigin: 'automatic',
    title,
    body,
    href: status === 'approved' ? '/articles/a/' : '/articles/pending/',
    sourceIds: ['v'],
    dedupeKey: `article-version:v:${status}`,
  });
  expect(notifyArticleVersionSubscribers).not.toHaveBeenCalled();
});

it.each(['create', 'edit'] as const)('keeps pending recipients for %s', async (source) => {
  await notifyArticleOutcome({ ...base, source, status: 'pending', categoryId: 'c' });
  expect(notifyArticleVersionSubscribers).toHaveBeenCalledWith({
    actorUserId: 'u',
    articleId: 'a',
    articleTitle: '攻略',
    proposedCategoryId: 'c',
    versionId: 'v',
  });
  expect(publishNotification).not.toHaveBeenCalled();
});

it.each(['approved', 'rejected'] as const)(
  'preserves manual %s feedback and links',
  async (status) => {
    jest
      .mocked(getPublicUserSubmissionHref)
      .mockResolvedValue('/users/editor?tab=submissions&highlight=v');
    await notifyArticleOutcome({ ...base, source: 'moderation', status, feedback: '请补充来源' });
    expect(publishNotification).toHaveBeenCalledWith({
      recipientUserId: 'u',
      kind: `article_version_${status}`,
      decisionOrigin: 'manual',
      title: status === 'approved' ? '文章已通过审核' : '文章未通过审核',
      body: `您的文章《攻略》${status === 'approved' ? '已通过审核并发布。' : '未通过审核。'}审核反馈：请补充来源`,
      href: status === 'approved' ? '/articles/a/' : '/users/editor?tab=submissions&highlight=v',
      sourceIds: ['v'],
      dedupeKey: `article-version:v:${status}`,
    });
  }
);

it('still delivers rejection if the profile lookup fails, and never notifies revocation', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.mocked(getPublicUserSubmissionHref).mockRejectedValueOnce(new Error('unavailable'));
  await notifyArticleOutcome({ ...base, source: 'moderation', status: 'rejected', feedback: null });
  expect(publishNotification).toHaveBeenCalledWith(
    expect.not.objectContaining({ href: expect.anything() })
  );
  await notifyArticleOutcome({ ...base, source: 'moderation', status: 'revoked', feedback: null });
  expect(publishNotification).toHaveBeenCalledTimes(1);
});

it.each(['pending', 'approved'] as const)(
  'does not throw on %s notification failure',
  async (status) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.mocked(notifyArticleVersionSubscribers).mockRejectedValueOnce(new Error('unavailable'));
    jest.mocked(publishNotification).mockRejectedValueOnce(new Error('unavailable'));
    await expect(
      notifyArticleOutcome({ ...base, source: 'edit', status, categoryId: 'c' })
    ).resolves.toBeUndefined();
  }
);
