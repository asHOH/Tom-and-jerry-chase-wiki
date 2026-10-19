import { fireEvent, render, screen } from '@testing-library/react';

import FilterRow from './FilterRow';

const catColors = {
  color: 'var(--game-factions-cat-text)',
  backgroundColor: 'var(--game-factions-cat-background)',
};

it('uses option colors for selection and only the text color for inactive hover', () => {
  const onToggle = jest.fn();
  const props = {
    label: '阵营',
    options: ['cat'],
    getOptionLabel: () => '猫阵营',
    getOptionColors: () => catColors,
    onToggle,
  };
  const { rerender } = render(<FilterRow {...props} isActive={() => false} />);
  const button = screen.getByRole('button', { name: '猫阵营' });

  expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(button.style.color).toBe('');
  expect(button.style.backgroundColor).toBe('');
  expect(button.style.getPropertyValue('--filter-button-hover-color')).toBe(catColors.color);

  fireEvent.click(button);
  expect(onToggle).toHaveBeenCalledWith('cat');
  rerender(<FilterRow {...props} isActive={() => true} />);
  expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(button).toHaveStyle(catColors);

  rerender(<FilterRow {...props} isActive={() => false} />);
  expect(button.style.color).toBe('');
  expect(button.style.backgroundColor).toBe('');
  expect(button.style.getPropertyValue('--filter-button-hover-color')).toBe(catColors.color);
});

it('keeps the active tone for an option without domain colors', () => {
  render(
    <FilterRow
      label='阵营'
      options={['cat', 'other']}
      isActive={() => true}
      onToggle={jest.fn()}
      getOptionColors={(option) => (option === 'cat' ? catColors : undefined)}
      activeTone={(option) => (option === 'other' ? 'strongNeutral' : 'default')}
    />
  );

  expect(screen.getByRole('button', { name: 'cat' })).toHaveStyle(catColors);
  const other = screen.getByRole('button', { name: 'other' });
  expect(other).toHaveAttribute('aria-pressed', 'true');
  expect(other).toHaveClass('bg-control-active');
  expect(other.style.backgroundColor).toBe('');
  expect(other.style.getPropertyValue('--filter-button-hover-color')).toBe('');
});

it('preserves gradient backgrounds and borders for selected options', () => {
  const colors = {
    color: 'red',
    background: 'linear-gradient(135deg, red, blue)',
    borderColor: 'red',
  };
  render(
    <FilterRow
      label='定位'
      options={['进攻']}
      isActive={() => true}
      onToggle={jest.fn()}
      getOptionColors={() => colors}
    />
  );

  const button = screen.getByRole('button', { name: '进攻' });
  expect(button.style.background).toBe(colors.background);
  expect(button.style.borderColor).toBe(colors.borderColor);
});

it('keeps colored options disabled when an interlock prevents selection', () => {
  const onToggle = jest.fn();
  render(
    <FilterRow
      label='阵营'
      options={['cat']}
      isActive={() => false}
      onToggle={onToggle}
      getOptionColors={() => catColors}
      getButtonDisabled={() => true}
    />
  );

  const button = screen.getByRole('button', { name: 'cat' });
  expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(onToggle).not.toHaveBeenCalled();
});
