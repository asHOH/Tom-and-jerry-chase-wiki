import { render, screen } from '@testing-library/react';

import DetailTextSection from './DetailTextSection';

jest.mock('../components/TextWithHoverTooltips', () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <span data-testid='display-text'>{text}</span>,
}));

describe('DetailTextSection', () => {
  it('falls back to the basic value when detailedValue contains only whitespace', () => {
    render(<DetailTextSection title='测试' value='基础内容' detailedValue='   ' isDetailedView />);

    expect(screen.getByTestId('display-text')).toHaveTextContent('基础内容');
  });

  it('uses the fallback when both values contain only whitespace', () => {
    render(
      <DetailTextSection
        title='测试'
        value={'\n  '}
        detailedValue={'\t'}
        isDetailedView
        fallbackText='待补充'
      />
    );

    expect(screen.getByTestId('display-text')).toHaveTextContent('待补充');
  });

  it('preserves meaningful whitespace around detailed content', () => {
    render(
      <DetailTextSection
        title='测试'
        value='基础内容'
        detailedValue='  详细内容  '
        isDetailedView
      />
    );

    expect(screen.getByTestId('display-text').textContent).toBe('  详细内容  ');
  });
});
