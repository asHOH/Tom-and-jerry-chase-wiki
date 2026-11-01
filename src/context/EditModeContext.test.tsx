import { useSearchParams } from 'next/navigation';
import { render, screen, waitFor } from '@testing-library/react';

import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
import type { PublishableEntityType } from '@/lib/gameData/publishableEntityTypes';
import { StorageKey } from '@/lib/localStorage';
import { usePublishedRevision } from '@/hooks/usePublishedRevision';
import PublishedRevisionBoundary from '@/components/PublishedRevisionBoundary';

import { EditModeProvider, useEditMode } from './EditModeContext';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: jest.fn(),
}));

jest.mock('@/components/EditRuntime', () => ({
  __esModule: true,
  default: function MockEditRuntime({
    onStatusChange,
  }: {
    onStatusChange: (status: EditRuntimeStatus) => void;
  }) {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(() => {
      onStatusChange('ready');
    }, [onStatusChange]);
    return null;
  },
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

function EditModeProbe() {
  const { isEditMode, isLoading, publishedRevisions } = useEditMode();

  return (
    <div
      data-testid='edit-mode-state-probe'
      data-edit-mode={String(isEditMode)}
      data-loading={String(isLoading)}
      data-revisions={publishedRevisions
        ?.map(({ entityType, revision }) => `${entityType}:${revision}`)
        .join(',')}
    />
  );
}

function PageRevision({
  entityType,
  revision,
}: {
  entityType: PublishableEntityType;
  revision: `v1:${string}`;
}) {
  usePublishedRevision(entityType, revision);
  return null;
}

describe('EditModeContext', () => {
  beforeEach(() => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('edit=1') as ReturnType<typeof useSearchParams>
    );
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('should expose edit mode state from the edit-mode context provider', async () => {
    render(
      <EditModeProvider>
        <EditModeProbe />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute('data-edit-mode', 'true');
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute('data-loading', 'false');
    });

    expect(window.localStorage.getItem(StorageKey.EditMode)).toBe('true');
  });

  it('tracks layout and page dependencies, preserving duplicate registrations on unmount', async () => {
    const page = (showDuplicate: boolean, revision: `v1:${string}`) => (
      <EditModeProvider>
        <PublishedRevisionBoundary revisions={{ traits: 'v1:traits', maps: 'v1:maps' }}>
          <PageRevision entityType='items' revision={revision} />
          {showDuplicate ? <PageRevision entityType='maps' revision='v1:maps' /> : null}
          <EditModeProbe />
        </PublishedRevisionBoundary>
      </EditModeProvider>
    );
    const view = render(page(true, 'v1:items'));
    await waitFor(() =>
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute(
        'data-revisions',
        'items:v1:items,maps:v1:maps,traits:v1:traits'
      )
    );
    view.rerender(page(false, 'v1:new-items'));
    await waitFor(() =>
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute(
        'data-revisions',
        'items:v1:new-items,maps:v1:maps,traits:v1:traits'
      )
    );
  });

  it('keeps conflicting versions of the same domain visible until the stale boundary leaves', async () => {
    const page = (showStale: boolean) => (
      <EditModeProvider>
        <PageRevision entityType='traits' revision='v1:current' />
        {showStale ? <PageRevision entityType='traits' revision='v1:stale' /> : null}
        <EditModeProbe />
      </EditModeProvider>
    );
    const view = render(page(true));
    await waitFor(() =>
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute(
        'data-revisions',
        'traits:v1:current,traits:v1:stale'
      )
    );
    view.rerender(page(false));
    await waitFor(() =>
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute(
        'data-revisions',
        'traits:v1:current'
      )
    );
  });
});
