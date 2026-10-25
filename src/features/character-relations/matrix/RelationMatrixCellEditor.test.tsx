import { fireEvent, render, screen } from '@testing-library/react';

import type { CharacterWithFaction } from '@/lib/types';

import type { RelationMatrixCellSelection } from './CharacterRelationsMatrix';
import RelationMatrixCellEditor from './RelationMatrixCellEditor';
import type {
  RelationMatrixCell,
  RelationMatrixColumnCategory,
  RelationMatrixEntity,
} from './relationMatrixViewModel';

type MockBaseDialogProps = {
  open: boolean;
  children: React.ReactNode;
  closeOnEsc?: boolean;
  closeOnOutsideClick?: boolean;
};

const mockBaseDialog = jest.fn(({ open, children }: MockBaseDialogProps) =>
  open ? <div role='dialog'>{children}</div> : null
);
const mockCharacters: Record<string, CharacterWithFaction> = {};

jest.mock('@/components/ui/BaseDialog', () => ({
  BaseDialog: (props: MockBaseDialogProps) => mockBaseDialog(props),
}));

const createEntity = (
  id: string,
  type: RelationMatrixEntity['type'] = 'character'
): RelationMatrixEntity => ({
  key: `${type}:${id}:`,
  id,
  label: id,
  type,
  href: `/${type}/${encodeURIComponent(id)}`,
});

const createCell = (
  sourceKind: RelationMatrixCell['sourceKind'],
  description = '现有说明',
  displayKind: RelationMatrixCell['displayKind'] = 'counter'
): RelationMatrixCell => ({
  sourceKind,
  displayKind,
  description,
  tooltipContent: `克制：${description}`,
  isMinor: true,
});

const createSelection = (
  cell: RelationMatrixCell | undefined,
  column: RelationMatrixEntity = createEntity('汤姆')
): RelationMatrixCellSelection => ({
  row: createEntity('杰瑞'),
  column,
  cell,
});

const renderEditor = ({
  selection,
  columnCategory = 'cat',
  onOpenChange = jest.fn(),
}: {
  selection: RelationMatrixCellSelection;
  columnCategory?: RelationMatrixColumnCategory;
  onOpenChange?: (open: boolean) => void;
}) => {
  render(
    <RelationMatrixCellEditor
      open
      selection={selection}
      columnCategory={columnCategory}
      onOpenChange={onOpenChange}
      updateCharacters={(mutate) => mutate(mockCharacters)}
    />
  );

  return { onOpenChange };
};

const getLatestBaseDialogProps = (): MockBaseDialogProps => {
  const call = mockBaseDialog.mock.calls[mockBaseDialog.mock.calls.length - 1];
  if (!call) throw new Error('BaseDialog was not rendered');
  return call[0];
};

describe('RelationMatrixCellEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables save for empty ambiguous cells until relation type is selected', () => {
    renderEditor({ selection: createSelection(undefined) });

    const saveButton = screen.getByRole('button', { name: '保存' });
    expect(saveButton).toBeDisabled();
    expect(screen.queryByRole('button', { name: '移除' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('关系类型'), { target: { value: 'counters' } });

    expect(saveButton).not.toBeDisabled();
  });

  it('renders the relation picker inline between the two targets', () => {
    renderEditor({ selection: createSelection(undefined) });

    expect(screen.getByRole('heading', { name: '编辑角色关系' })).toBeInTheDocument();
    expect(screen.getByText('杰瑞')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '关系类型' })).toHaveDisplayValue('选择关系');
    expect(screen.getByText('汤姆')).toBeInTheDocument();
    expect(screen.queryByText('杰瑞 与 汤姆')).not.toBeInTheDocument();
    expect(screen.queryByText('关系类型')).not.toBeInTheDocument();
  });

  it('prevents accidental dismissal while editing', () => {
    renderEditor({ selection: createSelection(undefined) });

    const dialogProps = getLatestBaseDialogProps();
    expect(dialogProps.closeOnEsc).toBe(false);
    expect(dialogProps.closeOnOutsideClick).toBe(false);
  });

  it('preselects existing relation kind and description', () => {
    renderEditor({ selection: createSelection(createCell('counteredBy', '原说明')) });

    expect(screen.getByLabelText('关系类型')).toHaveValue('counteredBy');
    expect(screen.getByLabelText(/^说明/)).toHaveValue('原说明');
    expect(screen.getByRole('button', { name: '次要' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('preselects map write relation kind from sourceKind instead of display kind', () => {
    renderEditor({
      selection: createSelection(
        createCell('advantageMaps', '地图说明', 'counter'),
        createEntity('经典之家I', 'map')
      ),
      columnCategory: 'map',
    });

    expect(screen.getByLabelText('关系类型')).toHaveValue('advantageMaps');
    expect(screen.getByRole('option', { name: '优势地图' })).toBeInTheDocument();
  });
});
