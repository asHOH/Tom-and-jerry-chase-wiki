import { render, screen } from '@testing-library/react';

import RichTextDisplay from '@/components/ui/RichTextDisplay';

describe('RichTextDisplay', () => {
  it('should render server-sanitized HTML immediately when provided', () => {
    const { container } = render(
      <RichTextDisplay
        content='<p>原始内容</p>'
        sanitizedContent='<p><strong>已净化内容</strong></p>'
      />
    );

    expect(container.querySelector('strong')).toHaveTextContent('已净化内容');
    expect(screen.queryByText('内容加载中...')).not.toBeInTheDocument();
  });

  it('should keep preview mode text-only', () => {
    const { container } = render(
      <RichTextDisplay content='<p><strong>预览内容</strong></p>' preview />
    );

    expect(screen.getByText('预览内容')).toBeInTheDocument();
    expect(container.querySelector('strong')).toBeNull();
  });
});
