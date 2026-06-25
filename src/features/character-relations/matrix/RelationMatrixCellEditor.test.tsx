import { fireEvent, render, screen } from '@testing-library/react';

import {
  removeCharacterRelationItemFromKinds,
  upsertCharacterRelationItem,
} from '@/features/characters/utils/characterRelationOverlay';

import type { RelationMatrixCellSelection } from './CharacterRelationsMatrix';
import RelationMatrixCellEditor from './RelationMatrixCellEditor';
import type {
  RelationMatrixCell,
  RelationMatrixColumnCategory,
  RelationMatrixEntity,
} from './relationMatrixViewModel';

jest.mock('@/components/ui/BaseDialog', () => ({
  BaseDialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div role='dialog'>{children}</div> : null,
}));

jest.mock('@/features/characters/utils/characterRelationOverlay', () => ({
  removeCharacterRelationItemFromKinds: jest.fn(),
  upsertCharacterRelationItem: jest.fn(),
}));

const removeCharacterRelationItemFromKindsMock = jest.mocked(removeCharacterRelationItemFromKinds);
const upsertCharacterRelationItemMock = jest.mocked(upsertCharacterRelationItem);

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
    />
  );

  return { onOpenChange };
};

describe('RelationMatrixCellEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables save for empty ambiguous cells until relation type is selected', () => {
    renderEditor({ selection: createSelection(undefined) });

    const saveButton = screen.getByRole('button', { name: '保存' });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('关系类型'), { target: { value: 'counters' } });

    expect(saveButton).not.toBeDisabled();
  });

  it('preselects existing relation kind and description', () => {
    renderEditor({ selection: createSelection(createCell('counteredBy', '原说明')) });

    expect(screen.getByLabelText('关系类型')).toHaveValue('counteredBy');
    expect(screen.getByLabelText('说明')).toHaveValue('原说明');
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

  it('saves changed relation type while preserving description', () => {
    const { onOpenChange } = renderEditor({
      selection: createSelection(createCell('counteredBy', '保留说明')),
      onOpenChange: jest.fn(),
    });

    fireEvent.change(screen.getByLabelText('关系类型'), { target: { value: 'counters' } });
    fireEvent.click(screen.getByRole('button', { name: '保存' }));

    expect(removeCharacterRelationItemFromKindsMock).toHaveBeenNthCalledWith(
      1,
      '杰瑞',
      ['counteredBy', 'counterEachOther'],
      '汤姆'
    );
    expect(removeCharacterRelationItemFromKindsMock).toHaveBeenNthCalledWith(
      2,
      '汤姆',
      ['counters', 'counterEachOther'],
      '杰瑞'
    );
    expect(upsertCharacterRelationItemMock).toHaveBeenNthCalledWith(1, '杰瑞', 'counters', {
      id: '汤姆',
      description: '保留说明',
      isMinor: true,
    });
    expect(upsertCharacterRelationItemMock).toHaveBeenNthCalledWith(2, '汤姆', 'counteredBy', {
      id: '杰瑞',
      description: '保留说明',
      isMinor: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('removes row and mirrored character relations', () => {
    const { onOpenChange } = renderEditor({
      selection: createSelection(createCell('counters')),
      onOpenChange: jest.fn(),
    });

    fireEvent.click(screen.getByRole('button', { name: '移除' }));

    expect(removeCharacterRelationItemFromKindsMock).toHaveBeenNthCalledWith(
      1,
      '杰瑞',
      ['counters', 'counteredBy', 'counterEachOther'],
      '汤姆'
    );
    expect(removeCharacterRelationItemFromKindsMock).toHaveBeenNthCalledWith(
      2,
      '汤姆',
      ['counteredBy', 'counters', 'counterEachOther'],
      '杰瑞'
    );
    expect(upsertCharacterRelationItemMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
