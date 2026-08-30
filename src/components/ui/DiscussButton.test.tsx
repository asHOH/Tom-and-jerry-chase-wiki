import { act, fireEvent, render, screen } from '@testing-library/react';

import DiscussButton from '@/components/ui/DiscussButton';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => '/characters/杰瑞/',
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
  }),
}));

describe('DiscussButton', () => {
  it('should link directly to the discussion route for SPA navigation', async () => {
    render(<DiscussButton />);

    const link = screen.getByRole('link', { name: '讨论' });
    expect(link).toHaveAttribute('href', '/discuss/characters/杰瑞');
    await act(async () => fireEvent.click(link));
    expect(mockPush).toHaveBeenCalledWith('/discuss/characters/杰瑞/');
  });

  it('should render the compact variant with the direct discussion URL', () => {
    render(<DiscussButton compact />);

    const link = screen.getByRole('link', { name: '讨论此页面' });
    expect(link).toHaveAttribute('href', '/discuss/characters/杰瑞');
  });
});
