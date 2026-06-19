import { render, screen, within } from '@testing-library/react';

import CharacterRelationsMatrix from './CharacterRelationsMatrix';
import {
  buildRelationMatrixViewModel,
  getRelationMatrixCell,
  type RelationMatrixViewModel,
} from './relationMatrixViewModel';

const getEntityKey = (
  entities: RelationMatrixViewModel['rows'] | RelationMatrixViewModel['columns'],
  id: string
) => {
  const entity = entities.find((item) => item.id === id);
  if (!entity) throw new Error(`Missing matrix entity ${id}`);
  return entity.key;
};

const getCellTestId = (viewModel: RelationMatrixViewModel, rowId: string, columnId: string) =>
  `relation-cell-${getEntityKey(viewModel.rows, rowId)}-${getEntityKey(viewModel.columns, columnId)}`;

describe('CharacterRelationsMatrix', () => {
  it('should render row and column headers as detail links', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    render(<CharacterRelationsMatrix viewModel={viewModel} />);

    expect(screen.getByRole('link', { name: '杰瑞' })).toHaveAttribute(
      'href',
      '/characters/%E6%9D%B0%E7%91%9E'
    );
    expect(screen.getByRole('link', { name: '汤姆' })).toHaveAttribute(
      'href',
      '/characters/%E6%B1%A4%E5%A7%86'
    );
  });

  it('should render blank empty cells, filled major cells, and dotted minor cells', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });
    const emptyColumn = viewModel.columns.find(
      (column) =>
        !getRelationMatrixCell(viewModel, getEntityKey(viewModel.rows, '杰瑞'), column.key)
    );

    if (!emptyColumn) throw new Error('Expected at least one empty cell for 杰瑞');

    render(<CharacterRelationsMatrix viewModel={viewModel} />);

    expect(
      screen.getByTestId(`relation-cell-${getEntityKey(viewModel.rows, '杰瑞')}-${emptyColumn.key}`)
    ).toBeEmptyDOMElement();

    const majorCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
    const majorTrigger = within(majorCell).getByLabelText(/被克制：杰瑞自保能力差/);
    expect(majorTrigger).toHaveClass('bg-red-500');
    expect(within(majorCell).queryByTestId('relation-minor-dot')).not.toBeInTheDocument();

    const minorCell = screen.getByTestId(getCellTestId(viewModel, '鲍姆', '托普斯'));
    const minorTrigger = within(minorCell).getByLabelText(/互克：二者克制关系主要取决于托普斯/);
    expect(minorTrigger).not.toHaveClass('bg-amber-400');
    expect(within(minorCell).getByTestId('relation-minor-dot')).toHaveClass('bg-amber-500');
  });
});
