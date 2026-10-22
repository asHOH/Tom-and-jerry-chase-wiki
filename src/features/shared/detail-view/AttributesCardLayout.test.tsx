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

describe.each([false, true])('AttributesCardLayout (mobile: %s)', (isMobile) => {
  beforeEach(() => {
    mockUseEditMode.mockReturnValue({ isEditMode: false });
    mockUseMobile.mockReturnValue(isMobile);
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

  it('renders the image, title, attributes, and edit button', () => {
    renderLayout();
    expect(screen.getByRole('img', { name: '测试' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '测试标题' })).toBeInTheDocument();
    expect(screen.getByText('属性内容')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '编辑按钮' })).toBeInTheDocument();
  });

  it('hides edit button when in edit mode', () => {
    mockUseEditMode.mockReturnValue({ isEditMode: true });
    renderLayout();
    expect(screen.queryByRole('button', { name: '编辑按钮' })).not.toBeInTheDocument();
  });
});
