import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { StorageKey } from '@/lib/localStorage';

import OnboardingTutorial from './OnboardingTutorial';

jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: ({
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

describe('OnboardingTutorial', () => {
  beforeEach(() => {
    localStorage.clear();
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('walks first-time editors through edit, preview, and submit', () => {
    render(
      <>
        <button type='button' data-tutorial-id='edit-mode-toolbar-preview'>
          预览
        </button>
        <button type='button' data-tutorial-id='edit-mode-toolbar-publish'>
          发布
        </button>
        <OnboardingTutorial tutorial='edit-mode-toolbar' isEnabled />
      </>
    );

    expect(screen.getByText('第 1 / 3 步')).toBeInTheDocument();
    expect(screen.getByText(/直接点击页面中带有编辑样式的字段/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('第 2 / 3 步')).toBeInTheDocument();
    expect(screen.getByText(/点击“预览”检查内容/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '下一步' }));
    expect(screen.getByText('第 3 / 3 步')).toBeInTheDocument();
    expect(screen.getByText(/填写修改说明并提交审核/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    expect(screen.queryByText('第 3 / 3 步')).not.toBeInTheDocument();
    expect(localStorage.getItem(StorageKey.TutorialEditModeToolbarSeen)).toBe('true');
  });

  it('links to the full guide and closes the introduction', () => {
    render(<OnboardingTutorial tutorial='edit-mode-toolbar' isEnabled />);

    const guideLink = screen.getByRole('link', { name: '查看完整编辑指南' });
    expect(guideLink).toHaveAttribute('href', '/usages/edit');

    fireEvent.click(guideLink);
    expect(screen.queryByRole('link', { name: '查看完整编辑指南' })).not.toBeInTheDocument();
    expect(localStorage.getItem(StorageKey.TutorialEditModeToolbarSeen)).toBe('true');
  });
});
