import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';

import CharacterRelationsMatrix, { RelationMatrixLegend } from './CharacterRelationsMatrix';
import {
  buildRelationMatrixViewModel,
  getRelationMatrixCell,
  type RelationMatrixViewModel,
} from './relationMatrixViewModel';

jest.mock('@/components/GotoLink', () => ({
  __esModule: true,
  default: ({
    name,
    href,
    className,
    categoryHint,
    triggerClassName,
    children,
  }: {
    name: string;
    href?: string;
    className?: string;
    categoryHint?: string;
    triggerClassName?: string;
    children: ReactNode;
  }) => (
    <a
      href={href}
      className={className}
      data-category-hint={categoryHint}
      data-trigger-class={triggerClassName}
      data-testid={`goto-link-${name}`}
    >
      {children}
    </a>
  ),
}));

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

    const rowLink = screen.getByTestId('goto-link-杰瑞');
    expect(rowLink).toHaveAttribute('href', '/characters/%E6%9D%B0%E7%91%9E');
    expect(rowLink).toHaveAttribute('data-category-hint', '鼠角色');
    expect(rowLink).toHaveAttribute('data-trigger-class', 'block h-7 leading-none');
    expect(rowLink).toHaveClass('no-underline');

    const columnLink = screen.getByTestId('goto-link-汤姆');
    expect(columnLink).toHaveAttribute('href', '/characters/%E6%B1%A4%E5%A7%86');
    expect(columnLink).toHaveAttribute('data-category-hint', '猫角色');
    expect(columnLink).toHaveClass('no-underline');
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
    expect(minorTrigger).not.toHaveClass('bg-amber-400', 'dark:bg-amber-500/90');
    expect(within(minorCell).getByTestId('relation-minor-dot')).toHaveClass(
      'bg-amber-400',
      'dark:bg-amber-500/90'
    );
  });

  it('should reuse one relation color class for fills, dots, and legend markers', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    render(
      <>
        <RelationMatrixLegend />
        <CharacterRelationsMatrix viewModel={viewModel} />
      </>
    );

    const majorCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
    const majorTrigger = within(majorCell).getByLabelText(/被克制：杰瑞自保能力差/);
    expect(majorTrigger).toHaveClass('bg-red-500', 'dark:bg-red-500/90');

    const minorCell = screen.getByTestId(getCellTestId(viewModel, '鲍姆', '托普斯'));
    const minorDot = within(minorCell).getByTestId('relation-minor-dot');
    expect(minorDot).toHaveClass('bg-amber-400', 'dark:bg-amber-500/90');
    expect(minorDot).not.toHaveClass('bg-amber-500', 'dark:bg-amber-400');

    const counterEachOtherLegendMarker = screen.getByText('互克').querySelector('[aria-hidden]');
    expect(counterEachOtherLegendMarker).toHaveClass('bg-amber-400', 'dark:bg-amber-500/90');
  });
});
