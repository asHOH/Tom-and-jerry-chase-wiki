import { render, screen } from '@testing-library/react';

import TabNavigationWrapper from './TabNavigationWrapper';

jest.mock('./TabNavigation', () => ({
  __esModule: true,
  default: () => <div data-testid='navigation' />,
}));

describe('TabNavigationWrapper', () => {
  it('owns the responsive viewport gutter and navigation clearance', () => {
    render(
      <TabNavigationWrapper>
        <div>页面内容</div>
      </TabNavigationWrapper>
    );

    const contentFrame = screen.getByText('页面内容').parentElement;

    expect(contentFrame).toHaveClass(
      'w-full',
      'max-w-7xl',
      'px-4',
      'sm:px-6',
      'lg:px-8',
      'app-content-shell',
      'pb-6'
    );
    expect(contentFrame?.className).not.toContain('pt-[');
    expect(contentFrame).not.toHaveClass('p-6');
  });
});
