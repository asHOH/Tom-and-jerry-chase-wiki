import { render, screen } from '@testing-library/react';

import { DocumentTextIcon, XCircleSolidIcon } from './CommonIcons';

describe('CommonIcons', () => {
  it('renders decorative icons as hidden by default', () => {
    render(<DocumentTextIcon data-testid='icon' />);

    expect(screen.getByTestId('icon')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByTestId('icon')).toHaveAttribute('focusable', 'false');
  });

  it('labels non-decorative icons', () => {
    render(<XCircleSolidIcon decorative={false} title='错误' />);

    expect(screen.getByRole('img', { name: '错误' })).toBeInTheDocument();
  });
});
