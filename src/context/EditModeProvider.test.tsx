import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';
import { StorageKey } from '@/lib/localStorage';

import { EditModeProvider, useEditMode } from './EditModeContext';

const mockRuntimeRender = jest.fn();
const mockRuntimeMount = jest.fn();
let mockRuntimeStatus: EditRuntimeStatus = 'ready';
let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: jest.fn(),
}));

jest.mock('@/components/EditRuntime', () => ({
  __esModule: true,
  default: function MockEditRuntime({
    visibleRevision,
    onStatusChange,
    onRetry,
  }: {
    visibleRevision?: `v1:${string}`;
    onStatusChange: (status: EditRuntimeStatus) => void;
    onRetry: () => void;
  }) {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    mockRuntimeRender(visibleRevision);
    useEffect(() => {
      mockRuntimeMount();
    }, []);
    useEffect(() => {
      onStatusChange(mockRuntimeStatus);
    }, [onStatusChange, visibleRevision]);
    return (
      <div data-testid='edit-runtime'>
        <button type='button' onClick={onRetry}>
          retry runtime
        </button>
      </div>
    );
  },
}));

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

function EditModeProbe({ revision }: { revision?: `v1:${string}` }) {
  const editMode = useEditMode();
  const { registerPublishedRevision } = editMode;

  useEffect(() => {
    if (!revision) return undefined;
    return registerPublishedRevision(revision);
  }, [registerPublishedRevision, revision]);

  return (
    <div
      data-testid='edit-mode-probe'
      data-edit-mode={String(editMode.isEditMode)}
      data-requested={String(editMode.isEditModeRequested)}
      data-loading={String(editMode.isLoading)}
      data-status={editMode.runtimeStatus}
    />
  );
}

describe('EditModeProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRuntimeStatus = 'ready';
    mockPathname = '/';
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('does not mount the edit runtime or enable editing on a normal route', async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('') as ReturnType<typeof useSearchParams>
    );

    render(
      <EditModeProvider>
        <EditModeProbe />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-edit-mode', 'false');
    });
    expect(screen.queryByTestId('edit-runtime')).not.toBeInTheDocument();
    expect(mockRuntimeRender).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(StorageKey.EditMode)).toBe('false');
  });

  it('mounts one lazy runtime for edit=1 and enables editing only after it is ready', async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('edit=1') as ReturnType<typeof useSearchParams>
    );

    render(
      <EditModeProvider>
        <EditModeProbe revision='v1:visible' />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-edit-mode', 'true');
    });
    expect(screen.getByTestId('edit-runtime')).toBeInTheDocument();
    expect(mockRuntimeRender).toHaveBeenLastCalledWith('v1:visible');
    expect(window.localStorage.getItem(StorageKey.EditMode)).toBe('true');
    expect(Number(window.localStorage.getItem(StorageKey.EditModeEnabledAt))).toBeGreaterThan(0);
  });

  it('keeps editing disabled when runtime initialization fails', async () => {
    mockRuntimeStatus = 'error';
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('edit=1') as ReturnType<typeof useSearchParams>
    );

    render(
      <EditModeProvider>
        <EditModeProbe revision='v1:visible' />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-status', 'error');
    });
    expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-edit-mode', 'false');
  });

  it('remounts a failed initial runtime exactly once when retrying', async () => {
    mockRuntimeStatus = 'error';
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('edit=1') as ReturnType<typeof useSearchParams>
    );

    render(
      <EditModeProvider>
        <EditModeProbe revision='v1:visible' />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-status', 'error');
    });
    expect(mockRuntimeMount).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'retry runtime' }));

    await waitFor(() => {
      expect(mockRuntimeMount).toHaveBeenCalledTimes(2);
    });
  });

  it('does not remount an already-ready runtime when retry is requested after navigation', async () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams('edit=1') as ReturnType<typeof useSearchParams>
    );
    const view = render(
      <EditModeProvider>
        <EditModeProbe revision='v1:first' />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-edit-mode', 'true');
    });
    expect(mockRuntimeMount).toHaveBeenCalledTimes(1);

    mockRuntimeStatus = 'error';
    mockPathname = '/characters/汤姆';
    view.rerender(
      <EditModeProvider>
        <EditModeProbe revision='v1:second' />
      </EditModeProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'retry runtime' }));

    await waitFor(() => {
      expect(screen.getByTestId('edit-mode-probe')).toHaveAttribute('data-status', 'error');
    });
    expect(mockRuntimeMount).toHaveBeenCalledTimes(1);
  });

  it('mounts one fresh runtime after edit mode is explicitly exited and re-entered', async () => {
    let searchParams = new URLSearchParams('edit=1');
    mockUseSearchParams.mockImplementation(
      () => searchParams as ReturnType<typeof useSearchParams>
    );
    const view = render(
      <EditModeProvider>
        <EditModeProbe revision='v1:first' />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(mockRuntimeMount).toHaveBeenCalledTimes(1);
    });

    searchParams = new URLSearchParams('');
    view.rerender(
      <EditModeProvider>
        <EditModeProbe revision='v1:first' />
      </EditModeProvider>
    );
    await waitFor(() => {
      expect(screen.queryByTestId('edit-runtime')).not.toBeInTheDocument();
    });

    searchParams = new URLSearchParams('edit=1');
    view.rerender(
      <EditModeProvider>
        <EditModeProbe revision='v1:second' />
      </EditModeProvider>
    );

    await waitFor(() => {
      expect(mockRuntimeMount).toHaveBeenCalledTimes(2);
    });
  });
});
