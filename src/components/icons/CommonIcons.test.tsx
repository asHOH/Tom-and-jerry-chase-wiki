import { render, screen } from '@testing-library/react';

import { DocumentTextIcon, TrashIcon, XCircleSolidIcon } from './CommonIcons';

describe('CommonIcons', () => {
  it('renders decorative icons as hidden by default', () => {
    render(<DocumentTextIcon data-testid='icon' />);

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('icon')).toHaveAttribute('focusable', 'false');
  });

  it('labels non-decorative icons', () => {
    render(<XCircleSolidIcon decorative={false} title='错误' />);

    expect(screen.getByRole('img', { name: '错误' })).toHaveAttribute('viewBox', '0 0 20 20');
    expect(screen.getByTitle('错误')).toBeInTheDocument();
  });

  it('keeps the canonical trash icon path', () => {
    const { container } = render(<TrashIcon />);

    expect(container.querySelector('path')).toHaveAttribute(
      'd',
      'M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0'
    );
  });
});
