import { render, screen } from '@testing-library/react';

import EditButton from '@/components/ui/EditButton';

const mockEnterEditMode = jest.fn();
let mockIsEditMode = false;

jest.mock('@/hooks/useSearchParamEditMode', () => ({
  useSearchParamEditMode: () => ({
    isEditMode: mockIsEditMode,
    enterEditMode: mockEnterEditMode,
  }),
}));

describe('EditButton', () => {
  beforeEach(() => {
    mockIsEditMode = false;
    mockEnterEditMode.mockClear();
  });

  it('should render compact edit as a blue icon button', () => {
    render(<EditButton compact />);

    const button = screen.getByRole('button', { name: '编辑此页面' });
    expect(button).toHaveClass('h-7', 'w-7', 'bg-blue-100', 'text-blue-800');
    expect(screen.queryByText('编辑')).not.toBeInTheDocument();
  });

  it('should render full edit as a primary button', () => {
    render(<EditButton />);

    expect(screen.getByRole('button', { name: '编辑' })).toHaveClass('bg-blue-600', 'text-white');
  });

  it('should hide when edit mode is enabled', () => {
    mockIsEditMode = true;

    render(<EditButton />);

    expect(screen.queryByRole('button', { name: '编辑' })).not.toBeInTheDocument();
  });
});
