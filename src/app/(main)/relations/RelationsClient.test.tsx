import { fireEvent, render, screen, within } from '@testing-library/react';

import RelationsClient from './RelationsClient';

const mockCharacterRelationsMatrix = jest.fn(({ cellSize }: { cellSize?: number }) => (
  <div data-testid='relation-matrix' data-cell-size={cellSize} />
));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false, jest.fn()] as const,
}));

jest.mock('@/features/character-relations/matrix/CharacterRelationsMatrix', () => ({
  __esModule: true,
  default: (props: { cellSize?: number }) => mockCharacterRelationsMatrix(props),
  RelationMatrixLegend: () => <div data-testid='relation-matrix-legend' />,
}));

describe('RelationsClient', () => {
  beforeEach(() => {
    mockCharacterRelationsMatrix.mockClear();
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
});
