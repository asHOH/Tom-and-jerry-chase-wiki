import type { ReactNode } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

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
  it.each([
    ['mouse', 'mouse', ['协作']],
    ['mouse', 'cat', ['克制', '被克制', '互克']],
    ['cat', 'mouse', ['克制', '被克制', '互克']],
    ['mouse', 'knowledgeCard', ['克制', '被克制']],
    ['cat', 'knowledgeCard', ['克制', '被克制']],
    ['mouse', 'specialSkill', ['克制', '被克制']],
    ['cat', 'specialSkill', ['克制', '被克制']],
    ['mouse', 'map', ['优势', '劣势']],
    ['cat', 'map', ['优势', '劣势']],
    ['mouse', 'mode', ['优势', '劣势']],
    ['cat', 'mode', ['优势', '劣势']],
  ] as const)(
    'only shows allowed legends for %s versus %s',
    (rowFaction, columnCategory, labels) => {
      render(<RelationMatrixLegend rowFaction={rowFaction} columnCategory={columnCategory} />);
      for (const label of ['克制', '被克制', '互克', '协作', '优势', '劣势']) {
        if ((labels as readonly string[]).includes(label)) {
          expect(screen.getByText(label)).toBeInTheDocument();
        } else {
          expect(screen.queryByText(label)).not.toBeInTheDocument();
        }
      }
    }
  );

  it.each(['map', 'mode'] as const)(
    'labels %s advantages from the row perspective',
    (columnCategory) => {
      render(<RelationMatrixLegend rowFaction='mouse' columnCategory={columnCategory} />);
      expect(screen.getByText('优势')).toBeInTheDocument();
      expect(screen.getByText('劣势')).toBeInTheDocument();
      expect(screen.queryByText('克制')).not.toBeInTheDocument();
    }
  );

  it('should render row and column headers as detail links', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    render(<CharacterRelationsMatrix viewModel={viewModel} />);

    const rowLink = screen.getByTestId('goto-link-杰瑞');
    expect(rowLink).toHaveAttribute('href', '/characters/%E6%9D%B0%E7%91%9E');
    expect(rowLink).toHaveAttribute('data-category-hint', '鼠角色');
    expect(rowLink).toHaveAttribute('data-trigger-class', 'block h-full leading-none');
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
      within(
        screen.getByTestId(
          `relation-cell-${getEntityKey(viewModel.rows, '杰瑞')}-${emptyColumn.key}`
        )
      ).getByRole('button', { name: `杰瑞 与 ${emptyColumn.label}：暂无关系记录` })
    ).toBeEmptyDOMElement();

    const majorCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
    const majorTrigger = within(majorCell).getByLabelText(/杰瑞被汤姆克制：杰瑞自保能力差/);
    expect(majorTrigger).toHaveClass('bg-red-500');
    expect(within(majorCell).queryByTestId('relation-minor-dot')).not.toBeInTheDocument();

    const minorCell = screen.getByTestId(getCellTestId(viewModel, '鲍姆', '托普斯'));
    const minorTrigger =
      within(minorCell).getByLabelText(/鲍姆与托普斯互相克制：二者克制关系主要取决于托普斯/);
    expect(minorTrigger).not.toHaveClass('bg-amber-400', 'dark:bg-amber-500/90');
    expect(within(minorCell).getByTestId('relation-minor-dot')).toHaveClass(
      'bg-amber-400',
      'dark:bg-amber-500/90'
    );
  });

  it('should apply caller-controlled matrix sizing to cells and filled triggers', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    render(<CharacterRelationsMatrix viewModel={viewModel} cellSize={36} />);

    const majorCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
    expect(majorCell).toHaveStyle('height: 36px; width: 36px; min-width: 36px');

    const majorTrigger = within(majorCell).getByLabelText(/杰瑞被汤姆克制：杰瑞自保能力差/);
    expect(majorTrigger).toHaveStyle('height: 36px; width: 36px');
  });

  it('should let row header links follow caller-controlled matrix sizing', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    render(<CharacterRelationsMatrix viewModel={viewModel} cellSize={36} />);

    const rowLink = screen.getByTestId('goto-link-杰瑞');
    expect(rowLink).toHaveAttribute('data-trigger-class', 'block h-full leading-none');
    expect(rowLink).toHaveClass('h-full');
    expect(rowLink).not.toHaveClass('h-7');
  });

  it('should reuse one relation color class for fills, dots, and legend markers', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });

    render(
      <>
        <RelationMatrixLegend rowFaction='mouse' columnCategory='cat' />
        <CharacterRelationsMatrix viewModel={viewModel} />
      </>
    );

    const majorCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
    const majorTrigger = within(majorCell).getByLabelText(/杰瑞被汤姆克制：杰瑞自保能力差/);
    expect(majorTrigger).toHaveClass('bg-red-500', 'dark:bg-red-500/90');

    const minorCell = screen.getByTestId(getCellTestId(viewModel, '鲍姆', '托普斯'));
    const minorDot = within(minorCell).getByTestId('relation-minor-dot');
    expect(minorDot).toHaveClass('bg-amber-400', 'dark:bg-amber-500/90');
    expect(minorDot).not.toHaveClass('bg-amber-500', 'dark:bg-amber-400');

    const counterEachOtherLegendMarker = screen.getByText('互克').querySelector('[aria-hidden]');
    expect(counterEachOtherLegendMarker).toHaveClass('bg-amber-400', 'dark:bg-amber-500/90');
  });

  it('should render legal empty cells as edit buttons in edit mode', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'mouse',
    });
    const row = viewModel.rows.find((item) => item.id === '杰瑞');
    const emptyColumn = viewModel.columns.find(
      (column) =>
        column.id !== '杰瑞' &&
        !getRelationMatrixCell(viewModel, getEntityKey(viewModel.rows, '杰瑞'), column.key)
    );
    const onCellSelect = jest.fn();

    if (!row || !emptyColumn) throw new Error('Expected editable empty mouse-mouse cell');

    render(
      <CharacterRelationsMatrix viewModel={viewModel} isEditMode onCellSelect={onCellSelect} />
    );

    const emptyCell = screen.getByTestId(
      `relation-cell-${getEntityKey(viewModel.rows, '杰瑞')}-${emptyColumn.key}`
    );
    const editButton = within(emptyCell).getByRole('button', {
      name: `编辑 杰瑞 与 ${emptyColumn.id} 的关系`,
    });

    fireEvent.click(editButton);

    expect(onCellSelect).toHaveBeenCalledWith({
      row,
      column: emptyColumn,
      cell: undefined,
    });
  });

  it('should render filled edit buttons without tooltip triggers and preserve relation visuals', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'cat',
    });
    const onCellSelect = jest.fn();

    render(
      <CharacterRelationsMatrix viewModel={viewModel} isEditMode onCellSelect={onCellSelect} />
    );

    const majorCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
    const majorButton = within(majorCell).getByRole('button', {
      name: '编辑 杰瑞 与 汤姆 的关系',
    });
    expect(majorButton).toHaveClass('bg-red-500', 'dark:bg-red-500/90');
    expect(
      within(majorCell).queryByLabelText(/杰瑞被汤姆克制：杰瑞自保能力差/)
    ).not.toBeInTheDocument();

    fireEvent.click(majorButton);

    expect(onCellSelect).toHaveBeenCalledWith({
      row: expect.objectContaining({ id: '杰瑞' }),
      column: expect.objectContaining({ id: '汤姆' }),
      cell: expect.objectContaining({ displayKind: 'counteredBy' }),
    });

    const minorCell = screen.getByTestId(getCellTestId(viewModel, '鲍姆', '托普斯'));
    const minorButton = within(minorCell).getByRole('button', {
      name: '编辑 鲍姆 与 托普斯 的关系',
    });
    expect(minorButton).not.toHaveClass('bg-amber-400', 'dark:bg-amber-500/90');
    expect(within(minorButton).getByTestId('relation-minor-dot')).toHaveClass(
      'bg-amber-400',
      'dark:bg-amber-500/90'
    );
  });

  it('should not render invalid self-cells as edit buttons', () => {
    const viewModel = buildRelationMatrixViewModel({
      rowFaction: 'mouse',
      columnCategory: 'mouse',
    });

    render(<CharacterRelationsMatrix viewModel={viewModel} isEditMode />);

    const selfCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '杰瑞'));
    expect(
      within(selfCell).queryByRole('button', { name: '编辑 杰瑞 与 杰瑞 的关系' })
    ).not.toBeInTheDocument();
  });

  describe('cell click highlighting', () => {
    it('should highlight the row and column when clicking a cell', () => {
      const viewModel = buildRelationMatrixViewModel({
        rowFaction: 'mouse',
        columnCategory: 'cat',
      });

      render(<CharacterRelationsMatrix viewModel={viewModel} />);

      const jerryTomCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
      fireEvent.click(within(jerryTomCell).getByRole('button'));

      // The clicked cell should have both row and col highlight attributes
      expect(jerryTomCell).toHaveAttribute('data-highlighted-row', '');
      expect(jerryTomCell).toHaveAttribute('data-highlighted-col', '');

      // Another cell in the same row should have row highlight
      const jerryTopsyCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '托普斯'));
      expect(jerryTopsyCell).toHaveAttribute('data-highlighted-row', '');
      expect(jerryTopsyCell).not.toHaveAttribute('data-highlighted-col');

      // Another cell in the same column should have col highlight
      const robinTomCell = screen.getByTestId(getCellTestId(viewModel, '罗宾汉杰瑞', '汤姆'));
      expect(robinTomCell).not.toHaveAttribute('data-highlighted-row');
      expect(robinTomCell).toHaveAttribute('data-highlighted-col', '');

      // A cell in a different row and column should not be highlighted
      const robinTopsyCell = screen.getByTestId(getCellTestId(viewModel, '罗宾汉杰瑞', '托普斯'));
      expect(robinTopsyCell).not.toHaveAttribute('data-highlighted-row');
      expect(robinTopsyCell).not.toHaveAttribute('data-highlighted-col');
    });

    it('should toggle off when clicking the same cell again', () => {
      const viewModel = buildRelationMatrixViewModel({
        rowFaction: 'mouse',
        columnCategory: 'cat',
      });

      render(<CharacterRelationsMatrix viewModel={viewModel} />);

      const cell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));

      fireEvent.click(within(cell).getByRole('button'));
      expect(cell).toHaveAttribute('data-highlighted-row', '');

      fireEvent.click(within(cell).getByRole('button'));
      expect(cell).not.toHaveAttribute('data-highlighted-row');
      expect(cell).not.toHaveAttribute('data-highlighted-col');
    });

    it('should move highlight to a new cell when clicking a different cell', () => {
      const viewModel = buildRelationMatrixViewModel({
        rowFaction: 'mouse',
        columnCategory: 'cat',
      });

      render(<CharacterRelationsMatrix viewModel={viewModel} />);

      const firstCell = screen.getByTestId(getCellTestId(viewModel, '杰瑞', '汤姆'));
      const secondCell = screen.getByTestId(getCellTestId(viewModel, '罗宾汉杰瑞', '托普斯'));

      fireEvent.click(within(firstCell).getByRole('button'));
      expect(firstCell).toHaveAttribute('data-highlighted-row', '');

      fireEvent.click(within(secondCell).getByRole('button'));
      expect(firstCell).not.toHaveAttribute('data-highlighted-row');
      expect(secondCell).toHaveAttribute('data-highlighted-row', '');
      expect(secondCell).toHaveAttribute('data-highlighted-col', '');
    });

    it('should not trigger highlight in edit mode', () => {
      const viewModel = buildRelationMatrixViewModel({
        rowFaction: 'mouse',
        columnCategory: 'mouse',
      });
      const row = viewModel.rows.find((item) => item.id === '杰瑞');
      const emptyColumn = viewModel.columns.find(
        (column) =>
          column.id !== '杰瑞' &&
          !getRelationMatrixCell(viewModel, getEntityKey(viewModel.rows, '杰瑞'), column.key)
      );
      const onCellSelect = jest.fn();

      if (!row || !emptyColumn) throw new Error('Expected editable empty mouse-mouse cell');

      render(
        <CharacterRelationsMatrix viewModel={viewModel} isEditMode onCellSelect={onCellSelect} />
      );

      const emptyCell = screen.getByTestId(
        `relation-cell-${getEntityKey(viewModel.rows, '杰瑞')}-${emptyColumn.key}`
      );
      const editButton = within(emptyCell).getByRole('button', {
        name: `编辑 杰瑞 与 ${emptyColumn.id} 的关系`,
      });

      fireEvent.click(editButton);

      // Edit mode click should call onCellSelect instead of highlighting
      expect(onCellSelect).toHaveBeenCalled();
      expect(emptyCell).not.toHaveAttribute('data-highlighted-row');
    });
  });
});

const originalResizeObserver = global.ResizeObserver;
beforeAll(() => {
  global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })) as unknown as typeof ResizeObserver;
});
afterAll(() => {
  global.ResizeObserver = originalResizeObserver;
});
