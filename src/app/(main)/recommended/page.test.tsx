import { render, screen } from '@testing-library/react';

import { getPublishedDomainsReadModel } from '@/lib/gameData/published/publishedSnapshot';
import { EditModeContext } from '@/context/EditModeContext';
import { characters, maps } from '@/data/static';

import RecommendedPage from './page';

jest.mock('@/lib/gameData/published/publishedSnapshot', () => ({
  getPublishedDomainsReadModel: jest.fn(),
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
    const characterId = Object.keys(characters)[0]!;
    const mapName = Object.keys(maps)[0]!;
    jest.mocked(getPublishedDomainsReadModel).mockResolvedValue({
      revisions: { characters: 'v1:characters', maps: 'v1:maps' },
      data: {
        characters: {
          ...characters,
          [characterId]: {
            ...characters[characterId]!,
            description: publishedCharacterDescription,
          },
        },
        maps: {
          ...maps,
          [mapName]: {
            ...maps[mapName]!,
            description: publishedMapDescription,
          },
        },
      },
    } as never);
    const registerPublishedRevision = jest.fn((_revision: `v1:${string}`) => jest.fn());

    render(
      <EditModeContext.Provider
        value={{
          isEditMode: false,
          isLoading: false,
          isPreviewMode: false,
          setIsPreviewMode: jest.fn(),
          registerPublishedRevision,
        }}
      >
        {await RecommendedPage()}
      </EditModeContext.Provider>
    );

    expect(screen.getByTestId('published-character')).toHaveTextContent(
      publishedCharacterDescription
    );
    expect(screen.getByTestId('published-map')).toHaveTextContent(publishedMapDescription);
    expect(getPublishedDomainsReadModel).toHaveBeenCalledWith(['characters', 'maps']);
    expect(registerPublishedRevision.mock.calls.map(([revision]) => revision)).toEqual([
      'v1:characters',
      'v1:maps',
    ]);
  });
});
