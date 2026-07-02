import { fireEvent, render, screen } from '@testing-library/react';

import AddAliasButton from './AddAliasButton';

describe('AddAliasButton', () => {
  it('renders an accessible add icon button and calls onAdd', () => {
    const onAdd = jest.fn();

    render(<AddAliasButton onAdd={onAdd} />);

    const button = screen.getByRole('button', { name: '添加别名' });
    expect(button).toHaveClass('h-4', 'w-4', 'bg-green-600');

    fireEvent.click(button);

    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
