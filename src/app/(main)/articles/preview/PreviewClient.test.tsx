import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import useSWR from 'swr';

import PreviewClient from './PreviewClient';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('token=preview-token'),
}));

jest.mock('swr', () => ({ __esModule: true, default: jest.fn() }));

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock('@/components/ui/RichTextDisplay', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div>{content}</div>,
}));

const previewData = {
  preview: {
    is_preview: true,
    preview_token: 'preview-token',
    article: {
      id: 'article-1',
      title: '新标题',
      category_id: 'category-new',
      character_id: '汤姆',
      categories: { name: '新分类' },
      users_public_view: { nickname: '作者' },
      version: {
        content: '<p>预览内容</p>',
        status: 'pending',
        created_at: '2026-08-07T00:00:00.000Z',
        commit_message: '更新元数据',
        editor: { nickname: '编辑者' },
      },
    },
  },
};

describe('PreviewClient', () => {
  it('renders the effective proposed metadata', () => {
    jest.mocked(useSWR).mockReturnValue({
      data: previewData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as never);

    render(<PreviewClient />);

    expect(screen.getByRole('heading', { name: '新标题' })).toBeInTheDocument();
    expect(screen.getByText('分类: 新分类')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '汤姆' })).toHaveAttribute(
      'href',
      '/characters/%E6%B1%A4%E5%A7%86'
    );
    expect(screen.getByText('<p>预览内容</p>')).toBeInTheDocument();
  });

  it('makes an intentional missing character binding visible', () => {
    jest.mocked(useSWR).mockReturnValue({
      data: {
        preview: {
          ...previewData.preview,
          article: { ...previewData.preview.article, character_id: null },
        },
      },
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as never);

    render(<PreviewClient />);

    expect(screen.getByText('关联角色: 未关联')).toBeInTheDocument();
  });
});
