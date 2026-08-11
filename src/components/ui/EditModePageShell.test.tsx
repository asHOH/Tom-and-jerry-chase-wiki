import { render, screen } from '@testing-library/react';

import type { GameDataSubmitMode } from '@/lib/gameData/submitMode';
import { EditModeContext, useEditMode } from '@/context/EditModeContext';

import EditModePageShell from './EditModePageShell';
import type { EditModeToolbarProps } from './EditModeToolbar';

const mockUsePageEditMode = jest.fn();
const mockInfo = jest.fn();
const mockExitEditMode = jest.fn();
const mockEditModeToolbar = jest.fn();
const mockSetIsPreviewMode = jest.fn();
const mockShowSubmissionFeedback = jest.fn();

function EditModeContextProbe() {
  const editMode = useEditMode();

  return (
    <div
      data-testid='edit-mode-context'
      data-requested={String(editMode.isEditModeRequested)}
      data-runtime-status={editMode.runtimeStatus}
      data-editable={String(editMode.isEditMode)}
      data-preview={String(editMode.isPreviewMode)}
    />
  );
}

jest.mock('@/hooks/usePageEditMode', () => ({
  usePageEditMode: (options: unknown) => mockUsePageEditMode(options),
}));

jest.mock('@/hooks/useContributionSubmissionFeedback', () => ({
  useContributionSubmissionFeedback: () => mockShowSubmissionFeedback,
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
  const createWrapper = (isEditMode: boolean, isPreviewMode = false) => {
    const EditModeTestWrapper = ({ children }: { children: React.ReactNode }) => (
      <EditModeContext
        value={{
          isEditMode,
          isLoading: false,
          isPreviewMode,
          setIsPreviewMode: mockSetIsPreviewMode,
        }}
      >
        {children}
      </EditModeContext>
    );
    EditModeTestWrapper.displayName = 'EditModeTestWrapper';
    return EditModeTestWrapper;
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePageEditMode.mockReturnValue({
      isEditMode: false,
      isDirty: false,
      isPublishing: false,
      draftInfo: null,
      draftsSummary: [],
      advancedSubmit: { available: false, defaultOutcome: 'pending', modes: ['default'] },
      discardChanges: jest.fn(),
      publishChanges: jest.fn(),
      getActionCount: () => 0,
    });
  });

  it('renders children and hides toolbar when not in edit mode', () => {
    const { container } = render(
      <EditModePageShell entityType='items' entityId='fork' entityName='Fork'>
        <div>content</div>
      </EditModePageShell>,
      { wrapper: createWrapper(false) }
    );

    expect(mockUsePageEditMode).toHaveBeenCalledWith({
      entityType: 'items',
      entityId: 'fork',
      showToast: mockInfo,
      onPublishSuccess: mockShowSubmissionFeedback,
    });
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(container.firstElementChild).toHaveClass('mx-auto', 'w-full', 'max-w-7xl');
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
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
      .fn<Promise<boolean>, [string | undefined, { submitMode?: GameDataSubmitMode } | undefined]>()
      .mockResolvedValue(true);

    mockUsePageEditMode.mockReturnValue({
      isEditMode: true,
      isDirty: true,
      isPublishing: true,
      draftInfo,
      draftsSummary,
      advancedSubmit: {
        available: true,
        defaultOutcome: 'approved',
        modes: ['default', 'force_public_pending', 'force_pending'],
      },
      discardChanges,
      publishChanges,
      getActionCount: () => 2,
    });

    render(
      <EditModePageShell entityType='items' entityId='fork' entityName='Fork'>
        <div>content</div>
      </EditModePageShell>,
      { wrapper: createWrapper(true) }
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
      advancedSubmit: {
        available: true,
        defaultOutcome: 'approved',
        modes: ['default', 'force_public_pending', 'force_pending'],
      },
      entityName: 'Fork',
    });
    expect(toolbarProps?.onDiscard).toBe(discardChanges);

    await expect(toolbarProps?.onPublish('publish summary')).resolves.toBe(true);
    expect(publishChanges).toHaveBeenCalledWith('publish summary', undefined);

    toolbarProps?.onExitEditMode();
    expect(mockExitEditMode).toHaveBeenCalledTimes(1);
  });

  it('keeps the toolbar visible while previewing in edit mode', () => {
    render(
      <EditModePageShell entityType='items' entityId='fork' entityName='Fork'>
        <EditModeContextProbe />
      </EditModePageShell>,
      { wrapper: createWrapper(true, true) }
    );

    expect(screen.getByTestId('edit-mode-toolbar')).toBeInTheDocument();
    expect(mockEditModeToolbar).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('edit-mode-context')).toHaveAttribute('data-requested', 'true');
    expect(screen.getByTestId('edit-mode-context')).toHaveAttribute('data-runtime-status', 'ready');
    expect(screen.getByTestId('edit-mode-context')).toHaveAttribute('data-editable', 'false');
    expect(screen.getByTestId('edit-mode-context')).toHaveAttribute('data-preview', 'true');
  });
});
