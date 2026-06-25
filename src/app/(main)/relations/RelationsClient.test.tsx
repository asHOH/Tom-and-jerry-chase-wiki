import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import type { RelationMatrixCellSelection } from '@/features/character-relations/matrix/CharacterRelationsMatrix';
import type { RelationMatrixColumnCategory } from '@/features/character-relations/matrix/relationMatrixViewModel';
import type { EditModeToolbarProps } from '@/components/ui/EditModeToolbar';

import RelationsClient from './RelationsClient';

type MockMatrixProps = {
  cellSize?: number;
  isEditMode?: boolean;
  onCellSelect?: (selection: RelationMatrixCellSelection) => void;
};

type MockEditorProps = {
  open: boolean;
  selection: RelationMatrixCellSelection | null;
  columnCategory: RelationMatrixColumnCategory;
  onOpenChange: (open: boolean) => void;
};

const mockSelection: RelationMatrixCellSelection = {
  row: {
    key: 'character:杰瑞:',
    id: '杰瑞',
    label: '杰瑞',
    type: 'character',
    href: '/characters/%E6%9D%B0%E7%91%9E',
  },
  column: {
    key: 'character:汤姆:',
    id: '汤姆',
    label: '汤姆',
    type: 'character',
    href: '/characters/%E6%B1%A4%E5%A7%86',
  },
  cell: undefined,
};

const mockDraftsSummary = [
  {
    entityType: 'characters',
    entityLabel: '角色',
    entityId: '杰瑞',
    itemLabel: '关系',
    count: 2,
    factionId: 'mouse' as const,
  },
];

const mockEnterEditMode = jest.fn();
const mockExitEditMode = jest.fn();
const mockToastInfo = jest.fn();
const mockDiscardChanges = jest.fn();
const mockPublishChanges = jest.fn(async (_message?: string) => true);
const mockGetActionCount = jest.fn(() => 2);
let mockIsEditMode = false;
let mockUserRole: string | null = null;
let mockRelationEditModeState = {
  isDirty: true,
  isPublishing: false,
  draftInfo: { actionCount: 2 },
  draftsSummary: mockDraftsSummary,
  discardChanges: mockDiscardChanges,
  publishChanges: mockPublishChanges,
  getActionCount: mockGetActionCount,
};

const mockCharacterRelationsMatrix = jest.fn(
  ({ cellSize, isEditMode, onCellSelect }: MockMatrixProps) => (
    <button
      type='button'
      data-testid='relation-matrix'
      data-cell-size={cellSize}
      data-edit-mode={String(!!isEditMode)}
      onClick={() => onCellSelect?.(mockSelection)}
    >
      select
    </button>
  )
);

const mockRelationMatrixCellEditor = jest.fn(
  ({ open, selection, columnCategory }: MockEditorProps) =>
    open ? (
      <div data-testid='relation-editor' data-column-category={columnCategory}>
        {selection?.row.label}
      </div>
    ) : null
);

const mockEditModeToolbar = jest.fn(({ actionCount, isDirty }: EditModeToolbarProps) => (
  <div data-testid='edit-toolbar' data-action-count={actionCount} data-is-dirty={String(isDirty)} />
));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/context/ToastContext', () => ({
  useToast: () => ({
    info: mockToastInfo,
  }),
}));

jest.mock('@/hooks/useUser', () => ({
  useUser: () => ({
    role: mockUserRole,
    nickname: null,
    isLoading: false,
    isValidating: false,
  }),
}));

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({
    isEditMode: mockIsEditMode,
    enterEditMode: mockEnterEditMode,
    exitEditMode: mockExitEditMode,
  }),
}));

jest.mock('@/features/character-relations/matrix/CharacterRelationsMatrix', () => ({
  __esModule: true,
  default: (props: MockMatrixProps) => mockCharacterRelationsMatrix(props),
  RelationMatrixLegend: () => <div data-testid='relation-matrix-legend' />,
}));

jest.mock('@/features/character-relations/matrix/RelationMatrixCellEditor', () => ({
  __esModule: true,
  default: (props: MockEditorProps) => mockRelationMatrixCellEditor(props),
}));

jest.mock('@/features/character-relations/matrix/useRelationMatrixEditMode', () => ({
  useRelationMatrixEditMode: () => mockRelationEditModeState,
}));

jest.mock('@/components/ui/EditModeToolbar', () => ({
  __esModule: true,
  default: (props: EditModeToolbarProps) => mockEditModeToolbar(props),
}));

const getLatestMatrixProps = (): MockMatrixProps => {
  const call =
    mockCharacterRelationsMatrix.mock.calls[mockCharacterRelationsMatrix.mock.calls.length - 1];
  if (!call) throw new Error('matrix was not rendered');
  return call[0];
};

const getLatestToolbarProps = (): EditModeToolbarProps => {
  const call = mockEditModeToolbar.mock.calls[mockEditModeToolbar.mock.calls.length - 1];
  if (!call) throw new Error('toolbar was not rendered');
  return call[0];
};

describe('RelationsClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEditMode = false;
    mockUserRole = null;
    mockGetActionCount.mockReturnValue(2);
    mockPublishChanges.mockResolvedValue(true);
    mockRelationEditModeState = {
      isDirty: true,
      isPublishing: false,
      draftInfo: { actionCount: 2 },
      draftsSummary: mockDraftsSummary,
      discardChanges: mockDiscardChanges,
      publishChanges: mockPublishChanges,
      getActionCount: mockGetActionCount,
    };
  });

  it('should default to mouse rows and cat columns, then fall back to mouse columns for cat rows', () => {
    render(<RelationsClient description='查看角色之间的关系。' />);

    expect(screen.getByRole('heading', { name: '角色关系' })).toBeInTheDocument();
    const rowGroup = screen.getByRole('group', { name: '行' });
    const columnGroup = screen.getByRole('group', { name: '列' });
    expect(within(rowGroup).getByRole('button', { name: '鼠' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(columnGroup).getByRole('button', { name: '猫' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.queryByRole('button', { name: '鼠阵营' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '猫角色' })).not.toBeInTheDocument();

    fireEvent.click(within(rowGroup).getByRole('button', { name: '猫' }));

    expect(within(rowGroup).getByRole('button', { name: '猫' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(within(columnGroup).queryByRole('button', { name: '猫' })).not.toBeInTheDocument();
    expect(within(columnGroup).getByRole('button', { name: '鼠' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('should control matrix size with a table-size slider without rendering the current value', () => {
    render(<RelationsClient description='关系说明' />);

    const matrix = screen.getByTestId('relation-matrix');
    expect(matrix).toHaveAttribute('data-cell-size', '28');
    expect(screen.queryByText('28')).not.toBeInTheDocument();

    const slider = screen.getByRole('slider', { name: '表格大小' });
    expect(slider).toHaveAttribute('min', '22');
    expect(slider).toHaveAttribute('max', '40');
    expect(slider).toHaveAttribute('step', '2');
    expect(screen.getByText('大小')).toHaveClass('shrink-0', 'whitespace-nowrap');

    fireEvent.change(slider, { target: { value: '36' } });

    expect(screen.getByTestId('relation-matrix')).toHaveAttribute('data-cell-size', '36');
    expect(screen.queryByText('36')).not.toBeInTheDocument();
  });

  it('should hide the edit button when the user has no editing role', () => {
    render(<RelationsClient description='关系说明' />);

    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();
  });

  it.each(['Contributor', 'Reviewer', 'Coordinator'])(
    'should show the edit button for %s users',
    (role) => {
      mockUserRole = role;

      render(<RelationsClient description='关系说明' />);

      expect(screen.getByRole('button', { name: '编辑' })).toBeInTheDocument();
    }
  );

  it('should exit unauthorized manual edit mode and keep edit UI hidden', async () => {
    mockIsEditMode = true;

    render(<RelationsClient description='关系说明' />);

    await waitFor(() => {
      expect(mockExitEditMode).toHaveBeenCalledTimes(1);
    });
    expect(mockToastInfo).toHaveBeenCalledWith('您没有权限编辑角色关系');
    expect(screen.queryByTestId('edit-toolbar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('relation-editor')).not.toBeInTheDocument();
    expect(screen.getByTestId('relation-matrix')).toHaveAttribute('data-edit-mode', 'false');
  });

  it('should pass edit mode and cell selection handlers to the matrix', () => {
    mockUserRole = 'Contributor';
    mockIsEditMode = true;

    render(<RelationsClient description='关系说明' />);

    const matrixProps = getLatestMatrixProps();
    expect(matrixProps.isEditMode).toBe(true);
    expect(matrixProps.onCellSelect).toEqual(expect.any(Function));

    fireEvent.click(screen.getByTestId('relation-matrix'));

    expect(screen.getByTestId('relation-editor')).toHaveAttribute('data-column-category', 'cat');
    expect(screen.getByTestId('relation-editor')).toHaveTextContent('杰瑞');
  });

  it('should pass relation edit draft state to the toolbar', async () => {
    mockUserRole = 'Reviewer';
    mockIsEditMode = true;

    render(<RelationsClient description='关系说明' />);

    const toolbarProps = getLatestToolbarProps();
    expect(toolbarProps).toEqual(
      expect.objectContaining({
        isDirty: true,
        actionCount: 2,
        draftInfo: { actionCount: 2 },
        draftsSummary: mockDraftsSummary,
        isPublishing: false,
        onDiscard: mockDiscardChanges,
        entityName: '角色关系',
      })
    );

    await expect(toolbarProps.onPublish('补充关系')).resolves.toBe(true);
    expect(mockPublishChanges).toHaveBeenCalledWith('补充关系');

    toolbarProps.onExitEditMode();
    expect(mockExitEditMode).toHaveBeenCalledTimes(1);
  });
});
