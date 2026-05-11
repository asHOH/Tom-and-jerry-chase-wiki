import { render, screen } from '@testing-library/react';

import AttributesCardLayout from './AttributesCardLayout';

const mockUseEditMode = jest.fn();

jest.mock('@/context/EditModeContext', () => ({
  useEditMode: () => mockUseEditMode(),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMobile: () => false,
}));

jest.mock('@/components/ui/EditButton', () => {
  return function MockEditButton() {
    return <button type='button'>编辑按钮</button>;
  };
});

jest.mock('@/components/ui/GameImage', () => {
  return function MockGameImage({ alt }: { alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} />;
  };
});

describe('AttributesCardLayout', () => {
  beforeEach(() => {
    mockUseEditMode.mockReturnValue({ isEditMode: false });
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
});
