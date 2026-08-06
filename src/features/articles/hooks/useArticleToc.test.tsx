import { act, render, screen, waitFor } from '@testing-library/react';

import { useArticleToc } from './useArticleToc';

type TocHarnessProps = {
  articleId?: string;
  content: string;
  showAutoNumbering?: boolean;
};

function TocHarness({
  articleId = 'article-1',
  content,
  showAutoNumbering = false,
}: TocHarnessProps) {
  const { contentRef, tocItems } = useArticleToc({
    articleId,
    content,
    showAutoNumbering,
  });

  return (
    <>
      <div
        ref={contentRef}
        data-testid='article-content'
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <output data-testid='toc-state'>{JSON.stringify(tocItems)}</output>
    </>
  );
}

const readTocState = () =>
  JSON.parse(screen.getByTestId('toc-state').textContent ?? '[]') as Array<{
    id: string;
    text: string;
    level: number;
    prefix: string;
  }>;

describe('useArticleToc', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/articles/article-1/');
  });

  it('builds unique heading links and skips a lone article title', async () => {
    render(
      <TocHarness content='<h1>Article title</h1><h2>Same heading</h2><h2>Same heading</h2>' />
    );

    await waitFor(() => {
      expect(readTocState()).toEqual([
        { id: 'same-heading', text: 'Same heading', level: 2, prefix: '一、' },
        { id: 'same-heading-1', text: 'Same heading', level: 2, prefix: '二、' },
      ]);
    });
  });

  it('removes existing numbering without discarding nested heading markup', async () => {
    const content = '<h2><strong>1、</strong>简介</h2><h3>详情</h3>';
    const { rerender } = render(<TocHarness content={content} showAutoNumbering />);

    await waitFor(() => {
      expect(readTocState()).toEqual([
        { id: '1、简介', text: '简介', level: 2, prefix: '一、' },
        { id: '详情', text: '详情', level: 3, prefix: '1' },
      ]);
    });

    const getNumberedHeading = () => screen.getByTestId('article-content').querySelector('h2');
    expect(getNumberedHeading()?.innerHTML).toBe('<strong></strong>简介');
    expect(getNumberedHeading()).toHaveAttribute('data-heading-prefix', '一、');

    rerender(<TocHarness content={content} />);

    await waitFor(() => {
      expect(getNumberedHeading()?.innerHTML).toBe('<strong>1、</strong>简介');
      expect(getNumberedHeading()).not.toHaveAttribute('data-heading-prefix');
    });
  });

  it('continues observing after the article temporarily has no TOC headings', async () => {
    render(<TocHarness content='<h1>Only the article title</h1>' />);

    expect(readTocState()).toEqual([]);

    const articleContent = screen.getByTestId('article-content');
    act(() => {
      articleContent.insertAdjacentHTML('beforeend', '<h2>Added later</h2>');
    });

    await waitFor(() => {
      expect(readTocState()).toEqual([
        { id: 'added-later', text: 'Added later', level: 2, prefix: '一、' },
      ]);
    });
  });
});
