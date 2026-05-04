import { fireEvent, render, screen } from '@testing-library/react';

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
});
