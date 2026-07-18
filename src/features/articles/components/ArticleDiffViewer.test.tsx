import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import ArticleDiffViewer from './ArticleDiffViewer';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    preserveEditParam: _preserveEditParam,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    href: string;
    preserveEditParam?: boolean;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const oldVersion = {
  id: 'old-version',
  content: '<p>汤姆可以快速攻击敌人</p>',
  created_at: '2026-01-01T08:00:00Z',
  commit_message: '旧提交',
  users: { nickname: '旧编辑者' },
};

const newVersion = {
  id: 'new-version',
  content: '<p>汤姆可以连续攻击敌人</p>',
  created_at: '2026-01-02T08:00:00Z',
  commit_message: '新提交',
  users: { nickname: '新编辑者' },
};

describe('ArticleDiffViewer', () => {
  it('renders chronological metadata, semantic inline changes, navigation, and newer content', () => {
    const { container } = render(
      <ArticleDiffViewer
        articleId='article-1'
        oldVersion={oldVersion}
        newVersion={newVersion}
        oldVersionNumber={3}
        newVersionNumber={4}
        olderComparisonHref='/articles/article-1/history?oldid=earlier&diff=old-version'
        newerComparisonHref='/articles/article-1/history?oldid=new-version&diff=later'
      />
    );

    expect(screen.getByText('旧版本')).toBeInTheDocument();
    expect(screen.getByText('版本 #3')).toBeInTheDocument();
    expect(screen.getByText('新版本')).toBeInTheDocument();
    expect(screen.getByText('版本 #4')).toBeInTheDocument();
    expect(screen.getByText(/旧编辑者/)).toBeInTheDocument();
    expect(screen.getByText(/新编辑者/)).toBeInTheDocument();
    expect(container.querySelector('del')).toBeInTheDocument();
    expect(container.querySelector('ins')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '← 更早的编辑' })).toHaveAttribute(
      'href',
      '/articles/article-1/history?oldid=earlier&diff=old-version'
    );
    expect(screen.getByRole('link', { name: '更新的编辑 →' })).toHaveAttribute(
      'href',
      '/articles/article-1/history?oldid=new-version&diff=later'
    );
    expect(screen.getByRole('heading', { name: '新版本完整内容' })).toBeInTheDocument();
    expect(screen.getByTestId('article-diff-table-scroll')).toHaveClass('overflow-x-auto');
    const columns = container.querySelectorAll('col');
    expect(columns[0]).toHaveClass('w-9');
    expect(columns[1]).toHaveClass('w-6');
    expect(columns[3]).toHaveClass('w-9');
    expect(columns[4]).toHaveClass('w-6');
  });

  it('expands collapsed context rows', () => {
    const oldContent = Array.from({ length: 12 }, (_, index) => `<p>段落 ${index}</p>`).join('');
    const changedContent = oldContent.replace('段落 6', '修改后的段落 6');
    render(
      <ArticleDiffViewer
        articleId='article-1'
        oldVersion={{ ...oldVersion, content: oldContent }}
        newVersion={{ ...newVersion, content: changedContent }}
        oldVersionNumber={1}
        newVersionNumber={2}
      />
    );

    const expandButtons = screen.getAllByRole('button', { name: /展开 \d+ 行未更改内容/ });
    expect(expandButtons.length).toBeGreaterThan(0);
    fireEvent.click(expandButtons[0]!);
    expect(screen.getAllByRole('button', { name: /展开 \d+ 行未更改内容/ }).length).toBe(
      expandButtons.length - 1
    );
  });

  it('shows an identical-content state for formatting-only changes', () => {
    render(
      <ArticleDiffViewer
        articleId='article-1'
        oldVersion={{ ...oldVersion, content: '<p><strong>相同</strong></p>' }}
        newVersion={{ ...newVersion, content: '<p>相同</p>' }}
        oldVersionNumber={1}
        newVersionNumber={2}
      />
    );

    expect(screen.getByText('没有可见内容差异')).toBeInTheDocument();
  });
});
