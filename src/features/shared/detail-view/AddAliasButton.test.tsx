import { fireEvent, render, screen } from '@testing-library/react';

import AddAliasButton from './AddAliasButton';

describe('AddAliasButton', () => {
  it('renders an accessible add icon button and calls onAdd', () => {
    const onAdd = jest.fn();

    render(<AddAliasButton onAdd={onAdd} />);

    const button = screen.getByRole('button', { name: '添加别名' });
    expect(button).toHaveClass('h-6', 'w-6', 'bg-green-100', 'text-green-800');

    fireEvent.click(button);

    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
