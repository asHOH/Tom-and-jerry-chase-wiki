import React, { type JSX } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { useChat } from '@/hooks/useChat';
import { env } from '@/env';

import SearchDialog from './SearchDialog';

const mockSelectCharacter = jest.fn();

jest.mock('@/env', () => ({ env: { NEXT_PUBLIC_AI_CHAT_MODEL: 'test-model' } }));

jest.mock('@/lib/searchUtils', () => ({
  performSearch: async function* () {
    yield { type: 'character', id: '汤姆' };
    yield { type: 'character', id: '杰瑞' };
  },
}));

jest.mock('@/hooks/useChat', () => ({
  useChat: jest.fn(() => ({
    responseText: null,
    isLoading: false,
    stop: jest.fn(),
  })),
}));

jest.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

jest.mock('@/context/AppContext', () => ({
  useAppContext: () => ({
    handleSelectCard: jest.fn(),
    handleSelectCharacter: mockSelectCharacter,
  }),
}));

jest.mock('@/context/DarkModeContext', () => ({
  useDarkMode: () => [false],
}));

jest.mock('motion/react', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const motionOnlyProps = new Set(['animate', 'exit', 'initial', 'transition', 'variants']);

  const createMotionTag = (tag: 'div' | 'li' | 'ul') => {
    const MotionTag = ReactModule.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
      ({ children, ...props }, ref) => {
        const htmlProps = Object.fromEntries(
          Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
        ) as React.HTMLAttributes<HTMLElement>;

        return ReactModule.createElement(tag, { ...htmlProps, ref }, children);
      }
    );
    MotionTag.displayName = `MockMotion(${tag})`;
    return MotionTag;
  };

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    m: {
      div: createMotionTag('div'),
      li: createMotionTag('li'),
      ul: createMotionTag('ul'),
    },
    useReducedMotion: () => false,
  } satisfies {
    AnimatePresence: (props: { children: React.ReactNode }) => JSX.Element;
    m: {
      div: ReturnType<typeof createMotionTag>;
      li: ReturnType<typeof createMotionTag>;
      ul: ReturnType<typeof createMotionTag>;
    };
    useReducedMotion: () => boolean;
  };
});

describe('SearchDialog', () => {
  const originalScrollIntoView = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'scrollIntoView'
  );

  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
    mockSelectCharacter.mockClear();
    Object.assign(env, { NEXT_PUBLIC_AI_CHAT_MODEL: 'test-model' });
    jest
      .mocked(useChat)
      .mockReturnValue({ responseText: null, isLoading: false, error: null, stop: jest.fn() });
  });

  afterEach(() => {
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
  });

  it('preserves result positions and selection when AI content changes', async () => {
    const { rerender } = render(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '汤姆' } });
    const result = await screen.findByRole('button', { name: '杰瑞 角色' });
    fireEvent.mouseEnter(result);
    const originalRows = screen.getAllByRole('listitem');

    for (const state of [
      { isLoading: true, responseText: null },
      { isLoading: true, responseText: '回答内容'.repeat(100) },
      { isLoading: false, responseText: '回答完成' },
      { isLoading: false, responseText: null },
    ]) {
      jest.mocked(useChat).mockReturnValue({ ...state, error: null, stop: jest.fn() });
      rerender(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
      if (state.isLoading && !state.responseText) {
        expect(screen.getByRole('status')).toHaveTextContent('正在回答…');
        expect(document.getElementById('search-ai-answer')).toBeEmptyDOMElement();
      }
      if (state.isLoading) {
        expect(screen.queryByRole('button', { name: '展开' })).not.toBeInTheDocument();
      }
      expect(screen.getByRole('region', { name: 'AI 助手' })).toHaveClass('h-28', 'shrink-0');
      expect(screen.getByRole('list').parentElement).toHaveClass('[overflow-anchor:none]');
      const rows = screen.getAllByRole('listitem');
      expect(rows[0]).toBe(originalRows[0]);
      expect(rows[1]).toBe(originalRows[1]);
      expect(result).toHaveClass('bg-control');
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowDown' });
      expect(screen.getByRole('button', { name: '汤姆 角色' })).toHaveClass('bg-control');
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' });
      expect(result).toHaveClass('bg-control');
    }
    jest.mocked(useChat).mockReturnValue({
      isLoading: true,
      responseText: null,
      error: null,
      stop: jest.fn(),
    });
    rerender(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });
    expect(mockSelectCharacter).toHaveBeenCalledWith('杰瑞');
    jest.mocked(useChat).mockReturnValue({
      isLoading: false,
      responseText: null,
      error: null,
      stop: jest.fn(),
    });
  });

  it.each([false, true])(
    'reserves a preview before loading and expands only on request (mobile: %s)',
    async (isMobile) => {
      const onClose = jest.fn();
      const { rerender } = render(<SearchDialog open onClose={onClose} isMobile={isMobile} />);
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '汤姆' } });
      const preview = screen.getByRole('region', { name: 'AI 助手' });
      expect(preview).toHaveClass('h-28');
      expect(screen.getByRole('status')).toHaveTextContent('输入完成后自动回答');
      expect(screen.queryByRole('button', { name: '展开' })).not.toBeInTheDocument();
      await screen.findByRole('button', { name: '汤姆 角色' });
      expect(screen.getByRole('list')).not.toContainElement(preview);
      expect(screen.getByText('2 个结果')).toBeInTheDocument();
      fireEvent.keyDown(screen.getByRole('textbox'), { key: 'ArrowUp' });
      expect(screen.getByRole('button', { name: '杰瑞 角色' })).toHaveClass('bg-control');

      const stop = jest.fn();
      jest.mocked(useChat).mockReturnValue({
        responseText: '很长的回答'.repeat(100),
        isLoading: true,
        error: null,
        stop,
      });
      rerender(<SearchDialog open onClose={onClose} isMobile={isMobile} />);
      expect(screen.queryByRole('button', { name: '展开' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: '停止 AI 回答' }));
      expect(stop).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('status')).toHaveTextContent('已停止回答');
      jest.mocked(useChat).mockReturnValue({
        responseText: '很长的回答'.repeat(100),
        isLoading: false,
        error: null,
        stop,
      });
      rerender(<SearchDialog open onClose={onClose} isMobile={isMobile} />);
      const expand = screen.getByRole('button', { name: '展开' });
      expand.focus();
      fireEvent.keyDown(expand, { key: 'Enter' });
      expect(mockSelectCharacter).not.toHaveBeenCalled();
      fireEvent.click(expand);
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: '返回搜索结果' })).toHaveFocus();
      expect(screen.getByText('很长的回答'.repeat(100))).toHaveClass('overflow-y-auto');
      fireEvent.click(screen.getByRole('button', { name: '返回搜索结果' }));
      expect(screen.getByRole('list')).toBeVisible();
      expect(preview).toHaveClass('h-28');
      fireEvent.click(screen.getByRole('button', { name: '展开' }));
      fireEvent.change(screen.getByRole('textbox'), { target: { value: '杰瑞' } });
      expect(screen.getByRole('list')).toBeVisible();
      expect(preview).toHaveClass('h-28');
    }
  );

  it('keeps failures in the reserved preview and hides it when AI is disabled', () => {
    jest.mocked(useChat).mockReturnValue({
      responseText: '',
      isLoading: false,
      error: new Error('offline'),
      stop: jest.fn(),
    });
    const { rerender } = render(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '汤姆' } });
    expect(screen.getByRole('status')).toHaveTextContent('暂时无法回答');
    expect(screen.getByRole('region', { name: 'AI 助手' })).toHaveClass('h-28');
    Object.assign(env, { NEXT_PUBLIC_AI_CHAT_MODEL: undefined });
    rerender(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    expect(screen.queryByRole('region', { name: 'AI 助手' })).not.toBeInTheDocument();
  });

  it('keeps the search glyph decorative beside the input', () => {
    render(<SearchDialog open onClose={jest.fn()} isMobile={false} />);

    const searchIcon = screen.getByRole('textbox').parentElement?.querySelector('svg');

    expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
    expect(searchIcon).toHaveAttribute('focusable', 'false');
    expect(screen.queryByRole('img', { name: '搜索图标' })).not.toBeInTheDocument();
  });

  it('uses controlled dismissal and clears the query before reopening', () => {
    const onClose = jest.fn();
    const { rerender } = render(<SearchDialog open onClose={onClose} isMobile={false} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: '汤姆' } });
    expect(searchInput).toHaveValue('汤姆');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<SearchDialog open={false} onClose={onClose} isMobile={false} />);
    expect(screen.queryByRole('dialog', { name: '搜索' })).not.toBeInTheDocument();

    rerender(<SearchDialog open onClose={onClose} isMobile />);
    expect(screen.getByRole('textbox')).toHaveValue('');
    expect(screen.getByRole('dialog', { name: '搜索' })).toHaveClass(
      'inset-0',
      'h-full',
      'w-full',
      'rounded-none'
    );
  });
});
