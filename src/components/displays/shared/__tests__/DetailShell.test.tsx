import { render, screen } from '@testing-library/react';

import { DetailSection, DetailShell } from '../DetailShell';

describe('DetailShell', () => {
  it('renders left column and default sections', () => {
    const sections: DetailSection[] = [
      {
        title: '简介',
        content: <p data-testid='default-section'>默认内容</p>,
        cardOptions: { testId: 'default-card' },
      },
    ];

    render(
      <DetailShell leftColumn={<div data-testid='left-column'>左侧内容</div>} sections={sections} />
    );

    expect(screen.getByTestId('left-column')).toBeInTheDocument();
    expect(screen.getByText('简介')).toBeInTheDocument();
    expect(screen.getByTestId('default-section')).toBeInTheDocument();
    expect(screen.getByTestId('default-card')).toHaveClass('card');
  });

  it('supports custom render sections and card variants', () => {
    render(
      <DetailShell
        leftColumn={<div />}
        sections={[
          {
            render: () => <div data-testid='custom-section'>自定义渲染</div>,
          },
          {
            title: '无卡片',
            content: <p data-testid='plain-section'>纯文本内容</p>,
            cardOptions: { variant: 'none', testId: 'plain-card' },
          },
          {
            title: '幽灵卡片',
            content: <p data-testid='ghost-section'>幽灵内容</p>,
            cardOptions: {
              variant: 'ghost',
              className: 'custom-card',
              testId: 'ghost-card',
            },
          },
        ]}
      />
    );

    expect(screen.getByTestId('custom-section')).toBeInTheDocument();
    expect(screen.queryByTestId('plain-card')).not.toBeInTheDocument();

    const ghostWrapper = screen.getByTestId('ghost-card');
    expect(ghostWrapper).toHaveClass('custom-card');
    expect(ghostWrapper).toHaveClass('border-dashed');
  });
});
