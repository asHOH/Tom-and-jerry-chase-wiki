import { render, screen } from '@testing-library/react';

import type { ArticleCharacterOption } from '@/lib/articles/articleCharacterOptions';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';

import EditArticlePage from './[id]/edit/page';
import NewArticlePage from './new/page';

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedDomainReadModel: jest.fn(),
}));

jest.mock('./new/NewArticleClient', () => ({
  __esModule: true,
  default: ({ characterOptions }: { characterOptions: readonly ArticleCharacterOption[] }) => (
    <div data-testid='new-character-options'>
      {characterOptions.map((character) => character.id).join(',')}
    </div>
  ),
}));

jest.mock('./[id]/edit/EditArticleClient', () => ({
  __esModule: true,
  default: ({ characterOptions }: { characterOptions: readonly ArticleCharacterOption[] }) => (
    <div data-testid='edit-character-options'>
      {characterOptions.map((character) => character.id).join(',')}
    </div>
  ),
}));

describe('article authoring character options', () => {
  it.each([
    ['new', NewArticlePage, 'new-character-options'],
    ['edit', EditArticlePage, 'edit-character-options'],
  ] as const)('passes published character summaries to the %s form', async (_, Page, testId) => {
    jest.mocked(getPublishedDomainReadModel).mockResolvedValue({
      entityType: 'characters',
      revision: 'v1:published',
      data: {
        __published_article_character__: {
          id: '__published_article_character__',
          factionId: 'mouse',
        },
      },
    } as never);

    render(await Page());

    expect(screen.getByTestId(testId)).toHaveTextContent('__published_article_character__');
    expect(getPublishedDomainReadModel).toHaveBeenCalledWith('characters');
  });
});
