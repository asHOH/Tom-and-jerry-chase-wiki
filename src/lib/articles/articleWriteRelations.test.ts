import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { supabaseAdmin } from '@/lib/supabase/admin';

import {
  ArticleWriteValidationError,
  resolveArticleCharacterForWrite,
} from './articleWriteRelations';

jest.mock('server-only', () => ({}), { virtual: true });

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedDomainReadModel: jest.fn(),
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: jest.fn() },
}));

const getPublishedDomainReadModelMock = jest.mocked(getPublishedDomainReadModel);
const adminFromMock = jest.mocked(supabaseAdmin!.from);
const categorySelectMock = jest.fn();

describe('resolveArticleCharacterForWrite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    adminFromMock.mockReturnValue({ select: categorySelectMock } as never);
  });

  it('rejects an unknown category', async () => {
    categorySelectMock.mockResolvedValue({ data: [], error: null });

    await expect(
      resolveArticleCharacterForWrite({ categoryId: 'missing', characterId: null })
    ).rejects.toBeInstanceOf(ArticleWriteValidationError);
  });

  it('normalizes characters to null when the category does not require one', async () => {
    categorySelectMock.mockResolvedValue({
      data: [{ id: 'ordinary', parent_category_id: null, requires_character: false }],
      error: null,
    });

    await expect(
      resolveArticleCharacterForWrite({ categoryId: 'ordinary', characterId: 'Tom' })
    ).resolves.toBeNull();
    expect(getPublishedDomainReadModelMock).not.toHaveBeenCalled();
  });

  it('requires a published selectable character for marked categories', async () => {
    categorySelectMock.mockResolvedValue({
      data: [{ id: 'strategy', parent_category_id: null, requires_character: true }],
      error: null,
    });
    getPublishedDomainReadModelMock.mockResolvedValue({
      data: {
        Tom: { id: 'Tom', factionId: 'cat' },
      },
    } as never);

    await expect(
      resolveArticleCharacterForWrite({ categoryId: 'strategy', characterId: null })
    ).rejects.toBeInstanceOf(ArticleWriteValidationError);
    await expect(
      resolveArticleCharacterForWrite({ categoryId: 'strategy', characterId: 'Unknown' })
    ).rejects.toBeInstanceOf(ArticleWriteValidationError);
    await expect(
      resolveArticleCharacterForWrite({ categoryId: 'strategy', characterId: 'Tom' })
    ).resolves.toBe('Tom');
  });
});
