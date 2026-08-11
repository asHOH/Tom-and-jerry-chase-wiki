/**
 * @jest-environment node
 */

import type { ReactNode } from 'react';
import { renderToString } from 'react-dom/server';

import type { Item } from '@/data/types';

import ItemDetails from './ItemDetails';

type EditModeState = {
  isEditMode: boolean;
  isEditModeRequested: boolean;
  runtimeStatus: 'idle' | 'refreshing' | 'ready';
  isPreviewMode: boolean;
};

const publishedItem = {
  name: 'fork',
  description: 'published description',
} as Item;

const draftItem = {
  ...publishedItem,
  description: 'draft description',
} as Item;

let mockEditMode: EditModeState;
let mockDraftRuntime: { stores: { items: Record<string, Item> } } | null;

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => mockEditMode,
}));

jest.mock('@/hooks/useDraftDataRuntime', () => ({
  useDraftDataRuntime: () => mockDraftRuntime,
}));

jest.mock('@/lib/edit/activeEditRuntime', () => ({
  useOptionalEditSnapshot: (store: Item | undefined, fallback: Item) => store ?? fallback,
}));

jest.mock('@/hooks/useLocalEditEntity', () => ({
  useLocalItem: () => ({ itemName: 'fork' }),
}));

jest.mock('@/hooks/useSpecifyTypeKeyboardNavigation', () => ({
  useSpecifyTypeKeyboardNavigation: jest.fn(),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({ isDetailedView: false }),
}));

jest.mock('@/components/ui/editable', () => ({
  editable: () => ({
    span: ({ initialValue }: { initialValue: string }) => (
      <input data-testid='edit-control' value={initialValue} readOnly />
    ),
  }),
}));

jest.mock('@/features/shared/detail-view/DetailShell', () => ({
  __esModule: true,
  default: ({
    title,
    attributes,
    sections,
  }: {
    title: string;
    attributes: ReactNode;
    sections: Array<{ key: string; content: ReactNode }>;
  }) => (
    <main>
      <h1>{title}</h1>
      {attributes}
      {sections.map((section) => (
        <section key={section.key}>{section.content}</section>
      ))}
    </main>
  ),
}));

jest.mock('@/features/shared/detail-view/DetailTextSection', () => ({
  __esModule: true,
  default: ({
    value,
    renderValue,
    children,
  }: {
    value?: string;
    renderValue?: ReactNode;
    children?: ReactNode;
  }) => (
    <div>
      <span>{value}</span>
      {renderValue}
      {children}
    </div>
  ),
}));

jest.mock('@/features/shared/detail-view/DetailOwnbuffsCard', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/features/shared/detail-view/DetailReverseCard', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/features/shared/detail-view/DetailTraitsCard', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('./ItemAttributesCard', () => ({
  __esModule: true,
  default: ({ item }: { item: Item }) => <aside>{item.name}</aside>,
}));

function renderWithState(state: EditModeState) {
  mockEditMode = state;
  return renderToString(<ItemDetails item={publishedItem} />);
}

describe('ItemDetails draft data selection', () => {
  beforeEach(() => {
    mockDraftRuntime = { stores: { items: { fork: draftItem } } };
  });

  it('renders published data outside edit mode', () => {
    const html = renderWithState({
      isEditMode: false,
      isEditModeRequested: false,
      runtimeStatus: 'idle',
      isPreviewMode: false,
    });

    expect(html).toContain('published description');
    expect(html).not.toContain('draft description');
    expect(html).not.toContain('data-testid="edit-control"');
  });

  it('renders draft data with controls while editing', () => {
    const html = renderWithState({
      isEditMode: true,
      isEditModeRequested: true,
      runtimeStatus: 'ready',
      isPreviewMode: false,
    });

    expect(html).toContain('draft description');
    expect(html).toContain('data-testid="edit-control"');
  });

  it('renders draft data without controls while previewing', () => {
    const html = renderWithState({
      isEditMode: false,
      isEditModeRequested: true,
      runtimeStatus: 'ready',
      isPreviewMode: true,
    });

    expect(html).toContain('draft description');
    expect(html).not.toContain('published description');
    expect(html).not.toContain('data-testid="edit-control"');
  });

  it('renders published data while the requested runtime is not ready', () => {
    const html = renderWithState({
      isEditMode: false,
      isEditModeRequested: true,
      runtimeStatus: 'refreshing',
      isPreviewMode: false,
    });

    expect(html).toContain('published description');
    expect(html).not.toContain('draft description');
    expect(html).not.toContain('data-testid="edit-control"');
  });
});
