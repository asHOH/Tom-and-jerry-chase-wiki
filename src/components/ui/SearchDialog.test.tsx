import React, { type JSX } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { performSearch } from '@/lib/searchUtils';
import type { SearchResult } from '@/lib/searchUtils/types';
import { useSearchGameData } from '@/hooks/useSearchGameData';

import { BaseDialog } from './BaseDialog';
import SearchDialog from './SearchDialog';

const mockNavigate = jest.fn();
const mockGameData = {} as ReturnType<typeof useSearchGameData>;

jest.mock('@/hooks/useSearchGameData', () => ({
  useSearchGameData: jest.fn(() => mockGameData),
}));
jest.mock('@/lib/searchUtils', () => ({ performSearch: jest.fn() }));

jest.mock('@/hooks/useNavigation', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
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
    mockNavigate.mockClear();
    jest.mocked(useSearchGameData).mockReturnValue(mockGameData);
    jest.mocked(performSearch).mockResolvedValue([
      {
        type: 'character',
        id: '汤姆',
        href: '/characters/tom-key',
        matchContext: '',
        priority: 1,
        isPinyinMatch: false,
      },
      {
        type: 'character',
        id: '杰瑞',
        href: '/characters/jerry-key',
        matchContext: '',
        priority: 1,
        isPinyinMatch: false,
      },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalScrollIntoView) {
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoView);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
    }
  });

  it('focuses the search input after replacing a loading dialog and restores the trigger on close', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const { rerender } = render(
      <BaseDialog key='loading' open onOpenChange={jest.fn()} ariaLabel='准备搜索'>
        正在准备搜索…
      </BaseDialog>
    );
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveFocus());
    rerender(<SearchDialog key='ready' open onClose={jest.fn()} isMobile={false} />);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    rerender(<SearchDialog key='ready' open={false} onClose={jest.fn()} isMobile={false} />);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('keeps search independent of AI and supports keyboard selection', async () => {
    const fetchSpy = jest.fn();
    const originalFetch = global.fetch;
    global.fetch = fetchSpy;
    try {
      render(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '汤姆' } });
      await screen.findByRole('button', { name: '汤姆 角色' });
      expect(screen.queryByText('AI 助手')).not.toBeInTheDocument();
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('/characters/jerry-key');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('ignores an older search that resolves after a newer query', async () => {
    let resolveOldSearch!: (results: SearchResult[]) => void;
    jest.mocked(performSearch).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOldSearch = resolve;
        })
    );
    render(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '旧查询' } });
    await waitFor(() => expect(performSearch).toHaveBeenCalledWith('旧查询', mockGameData));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '新查询' } });
    await screen.findByRole('button', { name: '汤姆 角色' });
    await act(async () => {
      resolveOldSearch([]);
    });
    expect(screen.getByRole('button', { name: '汤姆 角色' })).toBeInTheDocument();
    expect(screen.getByText('2 个结果')).toBeInTheDocument();
  });

  it('shows local search failures and recovers on a new query', async () => {
    jest.mocked(performSearch).mockRejectedValueOnce(new Error('search failed'));
    render(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '汤姆' } });
    expect(await screen.findByRole('alert')).toHaveTextContent('搜索暂时不可用');
    expect(screen.queryByText('无结果')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '杰瑞' } });
    fireEvent.click(await screen.findByRole('button', { name: '杰瑞 角色' }));
    expect(mockNavigate).toHaveBeenCalledWith('/characters/jerry-key');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reruns the current query when a published snapshot arrives', async () => {
    const { rerender } = render(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '新别名' } });
    await screen.findByRole('button', { name: '汤姆 角色' });
    const published = { ...mockGameData, characters: {} };
    jest.mocked(useSearchGameData).mockReturnValue(published);
    jest.mocked(performSearch).mockResolvedValueOnce([]);
    rerender(<SearchDialog open onClose={jest.fn()} isMobile={false} />);
    await waitFor(() => expect(performSearch).toHaveBeenLastCalledWith('新别名', published));
    expect(await screen.findByText('无结果')).toBeInTheDocument();
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
      'h-dvh',
      'w-full',
      'rounded-none'
    );
  });
});
