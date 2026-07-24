import { useSearchParams } from 'next/navigation';
import { render, screen, waitFor } from '@testing-library/react';

import type { EditRuntimeStatus } from '@/lib/edit/editRuntimeStatus';

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
  const { isEditMode, isLoading } = useEditMode();

  return (
    <div
      data-testid='edit-mode-state-probe'
      data-edit-mode={String(isEditMode)}
      data-loading={String(isLoading)}
    />
  );
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

    expect(window.localStorage.getItem('isEditMode')).toBe('true');
  });
});
