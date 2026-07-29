import { render, screen } from '@testing-library/react';

import { getApprovedActionSnapshot } from '@/lib/gameData/published/getApprovedActionSnapshot';
import { getPublishedDomainReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { characters, maps } from '@/data/static';

import RecommendedPage from './page';

jest.mock('@/lib/gameData/published/getApprovedActionSnapshot', () => ({
  getApprovedActionSnapshot: jest.fn(),
}));

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedDomainReadModel: jest.fn(),
}));

jest.mock('./RecommendedPageClient', () => ({
  __esModule: true,
  default: ({
    characters: characterData,
    maps: mapData,
  }: {
    characters: typeof characters;
    maps: typeof maps;
  }) => (
    <div>
      <span data-testid='published-character'>{Object.values(characterData)[0]?.description}</span>
      <span data-testid='published-map'>{Object.values(mapData)[0]?.description}</span>
    </div>
  ),
}));

describe('recommended page published-data projection', () => {
  it('passes approved character and map values to the normal client', async () => {
    const publishedCharacterDescription = '__published_recommendation_character__';
    const publishedMapDescription = '__published_recommendation_map__';
    const snapshot = { actionRevision: 'v1:test' };
    jest.mocked(getApprovedActionSnapshot).mockResolvedValue(snapshot as never);
    jest.mocked(getPublishedDomainReadModel).mockImplementation(async (entityType) => {
      if (entityType === 'characters') {
        const characterId = Object.keys(characters)[0]!;
        return {
          entityType,
          revision: 'v1:test',
          data: {
            ...characters,
            [characterId]: {
              ...characters[characterId]!,
              description: publishedCharacterDescription,
            },
          },
        } as never;
      }
      const mapName = Object.keys(maps)[0]!;
      return {
        entityType,
        revision: 'v1:test',
        data: {
          ...maps,
          [mapName]: {
            ...maps[mapName]!,
            description: publishedMapDescription,
          },
        },
      } as never;
    });

    render(await RecommendedPage());

    expect(screen.getByTestId('published-character')).toHaveTextContent(
      publishedCharacterDescription
    );
    expect(screen.getByTestId('published-map')).toHaveTextContent(publishedMapDescription);
    expect(getPublishedDomainReadModel).toHaveBeenNthCalledWith(1, 'characters', snapshot);
    expect(getPublishedDomainReadModel).toHaveBeenNthCalledWith(2, 'maps', snapshot);
  });
});
