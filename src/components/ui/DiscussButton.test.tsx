import { render, screen } from '@testing-library/react';

import DiscussButton from '@/components/ui/DiscussButton';

jest.mock('next/navigation', () => ({
  usePathname: () => '/characters/杰瑞/',
}));

describe('DiscussButton', () => {
  it('should use document navigation so the server applies the discussion rewrite', () => {
    render(<DiscussButton />);

    const link = screen.getByRole('link', { name: '讨论' });
    expect(link).toHaveAttribute('href', '/characters/杰瑞/discussion/');
  });

  it('should render the compact variant with the rewritten public URL', () => {
    render(<DiscussButton compact />);

    const link = screen.getByRole('link', { name: '讨论此页面' });
    expect(link).toHaveAttribute('href', '/characters/杰瑞/discussion/');
  });
});
