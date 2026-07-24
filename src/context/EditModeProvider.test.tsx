import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';

import { EditModeProvider, useEditMode } from './EditModeContext';

const mockRuntimeRender = jest.fn();
let mockRuntimeStatus: EditRuntimeStatus = 'ready';

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: jest.fn(),
}));

jest.mock('@/components/EditRuntime', () => ({
  __esModule: true,
  default: function MockEditRuntime({
    visibleRevision,
    onStatusChange,
  }: {
    visibleRevision?: `v1:${string}`;
    onStatusChange: (status: EditRuntimeStatus) => void;
  }) {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    mockRuntimeRender(visibleRevision);
    useEffect(() => {
      onStatusChange(mockRuntimeStatus);
    }, [onStatusChange]);
    return <div data-testid='edit-runtime' />;
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
    expect(window.localStorage.getItem('isEditMode')).toBe('false');
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
    expect(window.localStorage.getItem('isEditMode')).toBe('true');
    expect(Number(window.localStorage.getItem('editmode:enabledAt'))).toBeGreaterThan(0);
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
});
