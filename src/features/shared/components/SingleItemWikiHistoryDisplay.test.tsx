import { fireEvent, render, screen } from '@testing-library/react';

import { PublishedEntityHistoryProvider } from '@/context/PublishedEntityHistoryContext';
import { WikiChangeType } from '@/data/types';

import SingleItemWikiHistoryDisplay from './SingleItemWikiHistoryDisplay';

const mockUseWikiHistory = jest.fn();
const getHistoryLine = (text: string) =>
  screen.getByText((_, element) => element?.tagName === 'SPAN' && element.textContent === text);

jest.mock('@/hooks/useWikiHistory', () => ({
  useWikiHistory: () => mockUseWikiHistory(),
}));

describe('SingleItemWikiHistoryDisplay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-04T00:00:00+08:00'));
    mockUseWikiHistory.mockReturnValue([
      {
        year: 2026,
        date: '4.6',
        type: WikiChangeType.UPDATE,
        description: '更新 collaborators',
      },
      {
        year: 2025,
        date: '12.31',
        type: WikiChangeType.UPDATE,
        description: 'aliases.0',
      },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders compact history lines and hides zero-count change type totals', () => {
    render(<SingleItemWikiHistoryDisplay singleItem={{ name: '测试条目', type: 'character' }} />);

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText(`${WikiChangeType.UPDATE}:`)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText(`${WikiChangeType.CREATE}:`)).not.toBeInTheDocument();
    expect(screen.queryByText(`${WikiChangeType.ADD}:`)).not.toBeInTheDocument();
    expect(screen.queryByText(`${WikiChangeType.REMOVE}:`)).not.toBeInTheDocument();
    expect(screen.queryByText(`${WikiChangeType.REWORK}:`)).not.toBeInTheDocument();
    expect(getHistoryLine(`4.6 - ${WikiChangeType.UPDATE} collaborators`)).toBeInTheDocument();
    expect(getHistoryLine(`2025.12.31 - ${WikiChangeType.UPDATE} aliases.0`)).toBeInTheDocument();
    expect(
      getHistoryLine(`4.6 - ${WikiChangeType.UPDATE} collaborators`).closest('li')
    ).toHaveClass('grid', 'grid-cols-[3.25rem_auto_1fr]', 'gap-x-1');
  });

  it.each([false, true])('shows an unavailable notice with preserved entries: %s', (hasEntries) => {
    const item = { name: '测试条目', type: 'character' } as const;
    render(
      <PublishedEntityHistoryProvider
        item={item}
        history={{
          entries: hasEntries ? mockUseWikiHistory() : [],
          unavailable: true,
        }}
      >
        <SingleItemWikiHistoryDisplay singleItem={item} />
      </PublishedEntityHistoryProvider>
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      hasEntries ? '部分更新记录未能加载' : '更新记录加载失败'
    );
    expect(screen.getByRole('button', { name: '刷新页面' })).toHaveAttribute('type', 'button');
    if (hasEntries) {
      fireEvent.click(screen.getByRole('button', { name: '百科历史记录' }));
      expect(getHistoryLine(`4.6 - ${WikiChangeType.UPDATE} collaborators`)).toBeInTheDocument();
    } else {
      expect(screen.queryByRole('button', { name: '百科历史记录' })).not.toBeInTheDocument();
    }
  });

  it('shares failure status with related skills without leaking it to unrelated items', () => {
    mockUseWikiHistory.mockReturnValue([]);
    const { rerender } = render(
      <PublishedEntityHistoryProvider
        item={{ name: '汤姆', type: 'character' }}
        history={{ entries: [], unavailable: true }}
        relatedHistory={[{ item: { name: '发怒', type: 'skill' }, history: [] }]}
      >
        <SingleItemWikiHistoryDisplay singleItem={{ name: '发怒', type: 'skill' }} />
      </PublishedEntityHistoryProvider>
    );
    expect(screen.getByRole('status')).toHaveTextContent('更新记录加载失败');
    rerender(
      <PublishedEntityHistoryProvider
        item={{ name: '汤姆', type: 'character' }}
        history={{ entries: [], unavailable: true }}
      >
        <SingleItemWikiHistoryDisplay singleItem={{ name: '无关', type: 'item' }} />
      </PublishedEntityHistoryProvider>
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
