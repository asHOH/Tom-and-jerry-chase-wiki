import { fireEvent, render, screen, within } from '@testing-library/react';

import ViewModeToggle from './ViewModeToggle';

it('exposes the selected editor mode and requests a change when activated', () => {
  const onChange = jest.fn();
  const { rerender } = render(<ViewModeToggle mode='rich' onChange={onChange} />);
  const modes = within(screen.getByRole('group', { name: '编辑模式' }));

  expect(modes.getByRole('button', { name: 'Rich', pressed: true })).toBeInTheDocument();
  fireEvent.click(modes.getByRole('button', { name: 'HTML', pressed: false }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith('html');

  rerender(<ViewModeToggle mode='html' onChange={onChange} />);
  expect(modes.getByRole('button', { name: 'HTML', pressed: true })).toBeInTheDocument();
  expect(modes.getByRole('button', { name: 'Rich', pressed: false })).toBeInTheDocument();
});

it('preserves custom labels, hidden WikiText mode, and disabled controls', () => {
  const onChange = jest.fn();
  render(
    <ViewModeToggle
      mode='rich'
      onChange={onChange}
      labels={{ rich: '富文本', wiki: '维基文本' }}
      hideWiki
      disabled
    />
  );

  expect(screen.queryByRole('button', { name: /维基文本/ })).not.toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(2);
  for (const button of screen.getAllByRole('button')) {
    expect(button).toBeDisabled();
    fireEvent.click(button);
  }
  expect(screen.getByRole('button', { name: '富文本', pressed: true })).toBeInTheDocument();
  expect(onChange).not.toHaveBeenCalled();
});
