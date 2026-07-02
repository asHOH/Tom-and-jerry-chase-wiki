import { render, screen } from '@testing-library/react';

import EditButton from '@/components/ui/EditButton';

const mockEnterEditMode = jest.fn();

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({ enterEditMode: mockEnterEditMode }),
}));

describe('EditButton', () => {
  beforeEach(() => {
    mockEnterEditMode.mockClear();
  });

  it('should render compact edit as a blue icon button', () => {
    render(<EditButton compact />);

    const button = screen.getByRole('button', { name: '编辑此页面' });
    expect(button).toHaveClass('h-7', 'w-7', 'bg-blue-500');
    expect(screen.queryByText('编辑')).not.toBeInTheDocument();
  });

  it('should render full edit as a primary button', () => {
    render(<EditButton />);

    expect(screen.getByRole('button', { name: '编辑' })).toHaveClass('bg-blue-600', 'text-white');
  });
});
