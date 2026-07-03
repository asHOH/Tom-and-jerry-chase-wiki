import { render, screen } from '@testing-library/react';

import Notice from '@/components/ui/Notice';

describe('Notice', () => {
  it('renders error notices as assertive alerts', () => {
    render(<Notice variant='error'>保存失败</Notice>);

    const notice = screen.getByRole('alert');
    expect(notice).toHaveTextContent('保存失败');
    expect(notice).toHaveAttribute('aria-live', 'assertive');
    expect(notice).toHaveClass('border-red-200', 'bg-red-50', 'text-red-800');
  });

  it('renders non-error notices as polite status messages', () => {
    render(<Notice variant='warning'>请确认覆盖待审核版本</Notice>);

    const notice = screen.getByRole('status');
    expect(notice).toHaveAttribute('aria-live', 'polite');
    expect(notice).toHaveClass('border-amber-200', 'bg-amber-50', 'text-amber-800');
  });

  it('allows role and aria-live overrides', () => {
    render(
      <Notice variant='info' role='note' aria-live='off'>
        普通说明
      </Notice>
    );

    const notice = screen.getByRole('note');
    expect(notice).toHaveAttribute('aria-live', 'off');
  });
});
