import { notFound } from 'next/navigation';

import { resolveDiscussionTarget } from '@/lib/comments/scopeMapping';

import DiscussPage, { generateMetadata } from './page';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('not found');
  }),
}));
jest.mock('@/lib/comments/scopeMapping', () => ({ resolveDiscussionTarget: jest.fn() }));
jest.mock('@/features/discussion/TalkPage', () => ({ TalkPage: () => null }));

const target = {
  metadataTitle: '杰瑞 (角色) - 讨论',
  scope: 'characters',
  targetId: '杰瑞',
  entityTitle: '杰瑞',
  entityTypeLabel: '角色',
  parentUrl: '/characters/%E6%9D%B0%E7%91%9E/',
};

describe('discussion page route parameters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(resolveDiscussionTarget).mockResolvedValue(target);
  });

  it('decodes detail and faction segments before resolving the page', async () => {
    const page = await DiscussPage({
      params: Promise.resolve({ segments: ['special-skills', 'cat', '%E6%9D%B0%E7%91%9E'] }),
    });

    expect(resolveDiscussionTarget).toHaveBeenCalledWith(['special-skills', 'cat', '杰瑞']);
    expect(page.props).toMatchObject({ targetId: '杰瑞', parentUrl: target.parentUrl });
  });

  it('uses metadata parameters as supplied by Next.js', async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ segments: ['characters', '杰瑞'] }) })
    ).resolves.toEqual({ title: target.metadataTitle });
    expect(resolveDiscussionTarget).toHaveBeenCalledWith(['characters', '杰瑞']);
  });

  it('returns not found for malformed encoded segments', async () => {
    await expect(
      DiscussPage({ params: Promise.resolve({ segments: ['characters', '%E6%'] }) })
    ).rejects.toThrow('not found');
    expect(notFound).toHaveBeenCalled();
    expect(resolveDiscussionTarget).not.toHaveBeenCalled();
  });
});
