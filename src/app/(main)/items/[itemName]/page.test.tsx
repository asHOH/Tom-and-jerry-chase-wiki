import { render, screen } from '@testing-library/react';

import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { items } from '@/data';

import ItemDetailPage, { generateMetadata } from './page';

jest.mock('@/lib/gameData/published/routeSelectors', () => ({
  getPublishedEntityRouteReadModel: jest.fn(),
}));

jest.mock('@/components/StructuredData', () => ({
  __esModule: true,
  default: ({ data }: { data: unknown }) => (
    <script data-testid='structured-data'>{JSON.stringify(data)}</script>
  ),
}));

jest.mock('./ItemDetailsClient', () => ({
  __esModule: true,
  default: ({
    item,
    publishedRevision,
  }: {
    item: { description?: string };
    publishedRevision: string;
  }) => (
    <div data-revision={publishedRevision} data-testid='item-description'>
      {item.description}
    </div>
  ),
}));

describe('item detail published-data characterization', () => {
  const itemName = Object.keys(items)[0]!;

  it('reflects an approved action in rendering, metadata, and structured data', async () => {
    const publishedDescription = '__phase_0_published_description__';
    const revision = 'v1:published-route-revision';
    jest.mocked(getPublishedEntityRouteReadModel).mockResolvedValue({
      data: {
        ...items[itemName]!,
        description: publishedDescription,
      },
      revision,
      entityType: 'items',
      entityId: itemName,
      factionId: null,
      history: [],
    });

    const params = Promise.resolve({ itemName: encodeURIComponent(itemName) });
    const metadata = await generateMetadata({ params });
    render(await ItemDetailPage({ params }));

    expect(screen.getByTestId('item-description')).toHaveTextContent(publishedDescription);
    expect(screen.getByTestId('item-description')).toHaveAttribute('data-revision', revision);
    expect(metadata.description).toBe(publishedDescription);

    const structuredData = JSON.parse(
      screen.getByTestId('structured-data').textContent ?? '{}'
    ) as {
      description?: string;
    };
    expect(structuredData.description).toBe(publishedDescription);
  });
});
