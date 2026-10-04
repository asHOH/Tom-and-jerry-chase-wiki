import { useSearchParams } from 'next/navigation';
import { render, screen, waitFor } from '@testing-library/react';

import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
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
      data-revisions={publishedRevisions?.join(',')}
    />
  );
}

function PageRevision({ revision }: { revision: `v1:${string}` }) {
  usePublishedRevision(revision);
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
        <PublishedRevisionBoundary revisions={['v1:traits', 'v1:maps']}>
          <PageRevision revision={revision} />
          {showDuplicate ? <PageRevision revision='v1:maps' /> : null}
          <EditModeProbe />
        </PublishedRevisionBoundary>
      </EditModeProvider>
    );
    const view = render(page(true, 'v1:items'));
    await waitFor(() =>
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute(
        'data-revisions',
        'v1:items,v1:maps,v1:traits'
      )
    );
    view.rerender(page(false, 'v1:characters'));
    await waitFor(() =>
      expect(screen.getByTestId('edit-mode-state-probe')).toHaveAttribute(
        'data-revisions',
        'v1:characters,v1:maps,v1:traits'
      )
    );
  });
});
