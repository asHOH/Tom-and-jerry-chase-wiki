import { render, screen } from '@testing-library/react';

import { applyPublicActionRows } from '@/lib/gameData/actionReplay';
import type { PublicActionRow } from '@/lib/gameData/publicActionsTypes';
import { items } from '@/data';

import ItemDetailPage, { generateMetadata } from './page';

jest.mock('@/components/StructuredData', () => ({
  __esModule: true,
  default: ({ data }: { data: unknown }) => (
    <script data-testid='structured-data'>{JSON.stringify(data)}</script>
  ),
}));

jest.mock('./ItemDetailsClient', () => ({
  __esModule: true,
  default: ({ item }: { item: { description?: string } }) => (
    <div data-testid='item-description'>{item.description}</div>
  ),
}));

describe('item detail published-data characterization', () => {
  const itemName = Object.keys(items)[0]!;
  const itemRecord = items as unknown as Record<string, Record<string, unknown>>;
  let itemSnapshot: Record<string, unknown>;

  beforeEach(() => {
    itemSnapshot = structuredClone(itemRecord[itemName]!);
  });

  afterEach(() => {
    itemRecord[itemName] = structuredClone(itemSnapshot);
  });

  it('reflects an approved action in rendering, metadata, and structured data', async () => {
    const publishedDescription = '__phase_0_published_description__';
    const row: PublicActionRow = {
      id: 'phase-0-item-description',
      entity_type: 'items',
      entry: {
        op: 'set',
        path: `${itemName}.description`,
        oldValue: itemSnapshot.description,
        newValue: publishedDescription,
      },
      created_at: '2026-07-24T00:00:00.000Z',
      status: 'approved',
      message: 'Phase 0 characterization',
      reviewed_at: null,
      created_by: null,
    };

    expect(
      applyPublicActionRows({
        rows: [row],
        handledIds: new Set(),
        resolveTargets: () => [itemRecord],
      })
    ).toMatchObject({ handledCount: 1, mutatedCount: 1 });

    const params = Promise.resolve({ itemName: encodeURIComponent(itemName) });
    const metadata = await generateMetadata({ params });
    render(await ItemDetailPage({ params }));

    expect(screen.getByTestId('item-description')).toHaveTextContent(publishedDescription);
    expect(metadata.description).toBe(publishedDescription);

    const structuredData = JSON.parse(
      screen.getByTestId('structured-data').textContent ?? '{}'
    ) as {
      description?: string;
    };
    expect(structuredData.description).toBe(publishedDescription);
  });
});
