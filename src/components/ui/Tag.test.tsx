import { render, screen } from '@testing-library/react';

import Tag from './Tag';

describe('Tag', () => {
  it.each([
    ['default', ['px-2', 'py-1.5']],
    ['compact', ['px-1.75', 'py-1.25']],
    ['micro', ['px-1', 'py-0.75']],
  ] as const)('preserves the %s density', (margin, densityClasses) => {
    render(
      <Tag colorStyles={{ color: '#123456' }} margin={margin}>
        标签
      </Tag>
    );

    expect(screen.getByText('标签')).toHaveClass(
      'inline-block',
      'rounded-md',
      'border-0',
      'font-medium',
      ...densityClasses
    );
  });

  it.each([
    ['xxs', 'text-[0.625rem]'],
    ['xs', 'text-xs'],
    ['sm', 'text-sm'],
    ['md', 'text-base'],
  ] as const)('preserves the %s font size', (size, fontSizeClass) => {
    render(
      <Tag colorStyles={{ color: '#123456' }} size={size}>
        标签
      </Tag>
    );

    expect(screen.getByText('标签')).toHaveClass(fontSizeClass);
  });

  it('applies runtime colors after the base presentation styles', () => {
    render(
      <Tag
        colorStyles={{
          color: 'rgb(18, 52, 86)',
          backgroundColor: 'rgb(239, 246, 255)',
          borderColor: 'rgb(59, 130, 246)',
        }}
      >
        动态配色
      </Tag>
    );

    expect(screen.getByText('动态配色')).toHaveStyle({
      color: 'rgb(18, 52, 86)',
      backgroundColor: 'rgb(239, 246, 255)',
      borderColor: 'rgb(59, 130, 246)',
    });
  });
});
