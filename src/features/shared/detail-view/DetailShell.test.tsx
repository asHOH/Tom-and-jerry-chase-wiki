import { render, screen } from '@testing-library/react';

import DetailShell, { DetailSection } from './DetailShell';

describe('DetailShell', () => {
  it('renders left column and titled content sections', () => {
    const sections: DetailSection[] = [
      {
        title: '简介',
        content: <p data-testid='section-content'>默认内容</p>,
      },
    ];

    render(
      <DetailShell leftColumn={<div data-testid='left-column'>左侧内容</div>} sections={sections} />
    );

    expect(screen.getByTestId('left-column')).toBeInTheDocument();
    expect(screen.getByText('简介')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '简介' })).toHaveAttribute('id', 'Section:简介');
    expect(screen.getByRole('link', { name: '链接到简介' })).toHaveAttribute(
      'href',
      '#Section:简介'
    );
    expect(screen.getByTestId('section-content')).toBeInTheDocument();
  });

  it('supports untitled sections and custom section containers', () => {
    render(
      <DetailShell
        leftColumn={<div />}
        sections={[
          {
            content: <div data-testid='custom-section'>自定义渲染</div>,
            containerClassName: 'custom-section-container',
          },
        ]}
      />
    );

    expect(screen.getByTestId('custom-section')).toBeInTheDocument();
    expect(screen.getByTestId('custom-section').parentElement).toHaveClass(
      'custom-section-container'
    );
  });
});
