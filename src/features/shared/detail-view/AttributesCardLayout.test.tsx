import { render, screen } from '@testing-library/react';

import AttributesCardLayout from './AttributesCardLayout';

const mockUseEditMode = jest.fn();
const mockUseMobile = jest.fn();

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => mockUseEditMode(),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: () => mockUseMobile(),
}));

jest.mock('@/components/ui/EditButton', () => {
  return function MockEditButton() {
    return <button type='button'>编辑按钮</button>;
  };
});

jest.mock('@/components/ui/GameImage', () => {
  return function MockGameImage({ alt }: { alt: string }) {
    // oxlint-disable-next-line nextjs/no-img-element
    return <img alt={alt} />;
  };
});

describe('AttributesCardLayout', () => {
  beforeEach(() => {
    mockUseEditMode.mockReturnValue({ isEditMode: false });
    mockUseMobile.mockReturnValue(false);
  });

  const renderLayout = () =>
    render(
      <AttributesCardLayout
        imageUrl='/images/test.png'
        alt='测试'
        title='测试标题'
        attributes={<div>属性内容</div>}
      />
    );

  it('renders edit button when not in edit mode', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: '编辑按钮' })).toBeInTheDocument();
  });

  it('hides edit button when in edit mode', () => {
    mockUseEditMode.mockReturnValue({ isEditMode: true });
    renderLayout();
    expect(screen.queryByRole('button', { name: '编辑按钮' })).not.toBeInTheDocument();
  });

  it('uses static utility spacing without injecting spacing variables', () => {
    const { container } = renderLayout();

    const image = screen.getByRole('img', { name: '测试' });
    const attributes = screen.getByText('属性内容').parentElement;

    expect(container.firstElementChild).not.toHaveAttribute('style');
    expect(image.parentElement).toHaveClass('pb-1');
    expect(screen.getByRole('heading', { name: '测试标题' }).parentElement).toHaveClass(
      'px-4',
      'pt-2'
    );
    expect(attributes).toHaveClass('mx-4', 'py-1');
  });

  it('preserves the compact mobile title padding', () => {
    mockUseMobile.mockReturnValue(true);
    renderLayout();

    expect(screen.getByRole('heading', { name: '测试标题' })).toHaveClass('py-0', 'pt-2');
  });
});
