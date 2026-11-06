import { render, screen } from '@testing-library/react';

import {
  getPublishedReferenceSections,
  getReferenceActionSnapshot,
} from '@/lib/gameData/published/reverseReferences';
import { getPublishedEntityRouteReadModel } from '@/lib/gameData/published/routeSelectors';
import { items } from '@/data';

import ItemDetailPage, { generateMetadata } from './page';

jest.mock('@/lib/gameData/published/routeSelectors', () => ({
  getPublishedEntityRouteReadModel: jest.fn(),
}));

jest.mock('@/lib/gameData/published/reverseReferences', () => ({
  packPublishedReferenceSection: (section: unknown) => section,
  getReferenceActionSnapshot: jest.fn(async () => ({ rows: [], actionRevision: 'v1:snapshot' })),
  getPublishedReferenceSections: jest.fn(async () => ({
    sections: [{ title: '引用项', groups: [] }],
    revisions: { characters: 'v1:referring-character' },
  })),
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
    relatedRevisions,
  }: {
    item: { description?: string } | null;
    publishedRevision: string;
    relatedRevisions: { characters: string };
  }) => (
    <div data-revision={publishedRevision} data-testid='item-description'>
      <span data-testid='referring-revision'>{relatedRevisions.characters}</span>
      {item === null ? 'canonical-pointer' : item.description}
    </div>
  ),
}));

describe('item detail published-data characterization', () => {
  const itemName = Object.keys(items)[0]!;

  it.each(['canonical', 'renamed', 'added'] as const)(
    'transports the complete published item for %s when needed',
    async (kind) => {
      const key = kind === 'added' ? '__approved_new_item__' : itemName;
      const item =
        kind === 'canonical'
          ? { ...items[itemName]! }
          : { ...items[itemName]!, name: '新的名称', description: '完整公开内容' };
      jest.mocked(getPublishedEntityRouteReadModel).mockResolvedValue({
        data: item,
        entityId: key,
        entityType: 'items',
        factionId: null,
        revision: 'v1:item',
        history: { entries: [], unavailable: false },
      });
      render(await ItemDetailPage({ params: Promise.resolve({ itemName: key }) }));
      expect(screen.getByTestId('item-description')).toHaveTextContent(
        kind === 'canonical' ? 'canonical-pointer' : '完整公开内容'
      );
    }
  );

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
      history: { entries: [], unavailable: false },
    });

    const params = Promise.resolve({ itemName: encodeURIComponent(itemName) });
    const metadata = await generateMetadata({ params });
    render(await ItemDetailPage({ params }));

    expect(screen.getByTestId('item-description')).toHaveTextContent(publishedDescription);
    expect(screen.getByTestId('item-description')).toHaveAttribute('data-revision', revision);
    const snapshot = await jest.mocked(getReferenceActionSnapshot).mock.results[0]!.value;
    expect(getPublishedEntityRouteReadModel).toHaveBeenCalledWith(
      'items',
      itemName,
      undefined,
      snapshot
    );
    expect(getPublishedReferenceSections).toHaveBeenCalledWith(snapshot, [
      { type: 'item', name: items[itemName]!.name, sourceId: itemName },
    ]);
    expect(screen.getByTestId('referring-revision')).toHaveTextContent('v1:referring-character');
    expect(metadata.description).toBe(publishedDescription);

    const structuredData = JSON.parse(
      screen.getByTestId('structured-data').textContent ?? '{}'
    ) as {
      description?: string;
    };
    expect(structuredData.description).toBe(publishedDescription);
  });
});
