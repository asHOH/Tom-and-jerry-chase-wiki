import { render, screen } from '@testing-library/react';

import EditModePageShell from './EditModePageShell';
import type { EditModeToolbarProps } from './EditModeToolbar';

const mockUsePageEditMode = jest.fn();
const mockInfo = jest.fn();
const mockExitEditMode = jest.fn();
const mockEditModeToolbar = jest.fn();

jest.mock('@/context/EditModeContext', () => ({
  usePageEditMode: (options: unknown) => mockUsePageEditMode(options),
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    info: mockInfo,
  }),
}));

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({
    exitEditMode: mockExitEditMode,
  }),
}));

jest.mock('./EditModeToolbar', () => {
  return function MockEditModeToolbar(props: EditModeToolbarProps) {
    mockEditModeToolbar(props);
    return <div data-testid='edit-mode-toolbar'>toolbar</div>;
  };
});

describe('EditModePageShell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      <EditModePageShell entityType='items' entityId='fork' entityName='Fork'>
        <div>content</div>
      </EditModePageShell>
    );

    expect(mockUsePageEditMode).toHaveBeenCalledWith({
      entityType: 'items',
      entityId: 'fork',
      showToast: mockInfo,
    });
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByTestId('edit-mode-toolbar')).not.toBeInTheDocument();
    expect(mockEditModeToolbar).not.toHaveBeenCalled();
  });

  it('forwards the current edit-mode state and handlers to the toolbar', async () => {
    const draftInfo = { actionCount: 2 };
    const draftsSummary = [
      {
        entityType: 'items',
        entityLabel: 'Items',
        entityId: 'fork',
        itemLabel: 'Fork',
        count: 2,
      },
    ];
    const discardChanges = jest.fn();
    const publishChanges = jest
      .fn<Promise<boolean>, [string | undefined]>()
      .mockResolvedValue(true);

    mockUsePageEditMode.mockReturnValue({
      isEditMode: true,
      isDirty: true,
      isPublishing: true,
      draftInfo,
      draftsSummary,
      discardChanges,
      publishChanges,
      getActionCount: () => 2,
    });

    render(
      <EditModePageShell entityType='items' entityId='fork' entityName='Fork'>
        <div>content</div>
      </EditModePageShell>
    );

    expect(screen.getByTestId('edit-mode-toolbar')).toBeInTheDocument();
    expect(mockEditModeToolbar).toHaveBeenCalledTimes(1);

    const toolbarProps = mockEditModeToolbar.mock.calls[0]?.[0] as EditModeToolbarProps | undefined;

    expect(toolbarProps).toMatchObject({
      isDirty: true,
      actionCount: 2,
      isPublishing: true,
      draftInfo,
      draftsSummary,
      entityName: 'Fork',
    });
    expect(toolbarProps?.onDiscard).toBe(discardChanges);

    await expect(toolbarProps?.onPublish('publish summary')).resolves.toBe(true);
    expect(publishChanges).toHaveBeenCalledWith('publish summary');

    toolbarProps?.onExitEditMode();
    expect(mockExitEditMode).toHaveBeenCalledTimes(1);
  });
});
