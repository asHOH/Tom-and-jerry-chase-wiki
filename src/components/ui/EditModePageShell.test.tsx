import { render, screen } from '@testing-library/react';

import EditModePageShell from './EditModePageShell';

const mockUsePageEditMode = jest.fn();

jest.mock('@/context/EditModeContext', () => ({
  usePageEditMode: (options: unknown) => mockUsePageEditMode(options),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    info: jest.fn(),
  }),
}));

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({
    exitEditMode: jest.fn(),
  }),
}));

jest.mock('./EditModeToolbar', () => {
  return function MockEditModeToolbar() {
    return <div data-testid='edit-mode-toolbar'>toolbar</div>;
  };
});

describe('EditModePageShell', () => {
  beforeEach(() => {
    mockUsePageEditMode.mockReturnValue({
      isEditMode: false,
      isDirty: false,
      isPublishing: false,
      draftInfo: null,
      draftsSummary: [],
      discardChanges: jest.fn(),
      publishChanges: jest.fn(),
      getActionCount: () => 0,
    });
  });

  it('renders children and hides toolbar when not in edit mode', () => {
    render(
      <EditModePageShell entityType='items' entityId='叉子' entityName='叉子'>
        <div>content</div>
      </EditModePageShell>
    );

    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByTestId('edit-mode-toolbar')).not.toBeInTheDocument();
  });

  it('shows toolbar when in edit mode', () => {
    mockUsePageEditMode.mockReturnValue({
      isEditMode: true,
      isDirty: true,
      isPublishing: false,
      draftInfo: { actionCount: 2 },
      draftsSummary: [],
      discardChanges: jest.fn(),
      publishChanges: jest.fn(),
      getActionCount: () => 2,
    });

    render(
      <EditModePageShell entityType='items' entityId='叉子' entityName='叉子'>
        <div>content</div>
      </EditModePageShell>
    );

    expect(screen.getByTestId('edit-mode-toolbar')).toBeInTheDocument();
  });
});
