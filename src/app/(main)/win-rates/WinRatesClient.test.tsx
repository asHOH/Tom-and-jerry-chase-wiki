import type { AnchorHTMLAttributes } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';

import type { WinRatesEntry } from '@/data/winRates';
import { buildWinRateCharacterLookup } from '@/data/winRates/characterLookup';

import WinRatesClient from './WinRatesClient';

jest.mock('@/context/DarkModeContext', () => ({ useDarkMode: () => [false] }));
jest.mock('@/components/ui/MotionButton', () => jest.requireActual('@/components/ui/Button'));
jest.mock('@/components/Link', () => ({
  __esModule: true,
  default: (props: AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props} />,
}));
jest.mock('@/data/winRates', () => ({
  winRatesData: [
    {
      timeRange: 'S28',
      winRateSummary: [
        {
          rank: '至尊传奇',
          teamType: '总体',
          catWin: '55.00%',
          mouseWin: '45.00%',
          percent: '20.00%',
        },
        { rank: '机智黄金', teamType: '总体', catWin: '60.00%', mouseWin: '40.00%' },
      ],
      characterTables: [
        {
          rank: '至尊传奇',
          rows: [
            { character: '表演者▪杰瑞', pickRate: '3.00%', winRate: '70.00%' },
            { character: '海盗杰瑞', pickRate: '2.00%', winRate: '50.00%', banRate: '2.00%' },
            { character: '大表哥', pickRate: '1.00%', winRate: '60.00%', banRate: '0.00%' },
            { character: '蓝猫', pickRate: '4.00%', winRate: '55.00%', banRate: '4.00%' },
          ],
        },
        {
          rank: '机智黄金',
          rows: [{ character: '杰瑞', pickRate: '2.00%', winRate: '40.00%' }],
        },
        {
          rank: '全部',
          rows: [{ character: '杰瑞', pickRate: '3.00%', winRate: '50.00%' }],
        },
      ],
    },
    {
      timeRange: 'S24 (2025.4.30-2025.5.25)',
      tables: [
        {
          rank: '至尊传奇',
          faction: '猫',
          rows: [{ character: '蓝猫', pickRate: '2.00%', winRate: '60.00%' }],
        },
        {
          rank: '至尊传奇',
          faction: '鼠',
          rows: [{ character: '海盗杰瑞', pickRate: '3.00%', winRate: '40.00%' }],
        },
      ],
    },
    {
      timeRange: 'S23',
      winRateSummary: [
        { rank: '无敌猫鼠皇', teamType: '总体', catWin: '55.00%', mouseWin: '45.00%' },
      ],
      characterTables: [
        {
          rank: '无敌猫鼠皇',
          rows: [
            { character: '蓝猫', pickRate: '2.00%', winRate: '55.00%' },
            { character: '杰瑞', pickRate: '3.00%', winRate: '45.00%' },
          ],
        },
      ],
    },
  ] satisfies WinRatesEntry[],
}));

const characterLookup = buildWinRateCharacterLookup([
  { id: '表演者•杰瑞', factionId: 'mouse', aliases: ['表演者杰瑞'] },
  { id: '航海士杰瑞', factionId: 'mouse', aliases: ['海盗杰瑞'] },
  { id: '蒙金奇', factionId: 'mouse', aliases: ['大表哥'] },
  { id: '杰瑞', factionId: 'mouse' },
  { id: '汤姆', factionId: 'cat', aliases: ['蓝猫'] },
]);

const clickOption = (name: string) =>
  fireEvent.click(within(screen.getByRole('banner')).getByRole('button', { name }));
const table = () => within(screen.getByRole('table', { name: /^角色数据/ }));
const characterNames = () =>
  table()
    .getAllByRole('link')
    .map((link) => link.textContent);

describe('WinRatesClient', () => {
  beforeEach(() => {
    render(<WinRatesClient description='胜率数据' characterLookup={characterLookup} />);
  });

  it('removes unavailable rank filters when changing season', () => {
    clickOption('机智黄金');
    expect(characterNames()).toEqual(['杰瑞']);
    clickOption('S24 (2025.4.30-5.25)');
    expect(characterNames()).toEqual(['海盗杰瑞', '蓝猫']);
    expect(screen.queryByRole('button', { name: '清除筛选' })).not.toBeInTheDocument();
    clickOption('S28');
    expect(screen.getByRole('button', { name: '机智黄金' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('retains supported ranks and faction selections across seasons', () => {
    clickOption('至尊传奇');
    clickOption('机智黄金');
    clickOption('猫');
    clickOption('S24 (2025.4.30-5.25)');
    expect(characterNames()).toEqual(['蓝猫']);
    expect(screen.getByRole('button', { name: '至尊传奇' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('clears rank and faction filters while preserving season, sorting and columns', () => {
    clickOption('S24 (2025.4.30-5.25)');
    clickOption('至尊传奇');
    clickOption('猫');
    clickOption('登场率');
    fireEvent.click(table().getByRole('button', { name: '胜率' }));
    clickOption('清除筛选');
    expect(characterNames()).toEqual(['海盗杰瑞', '蓝猫']);
    expect(screen.getByRole('button', { name: 'S24 (2025.4.30-5.25)' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(table().getByRole('columnheader', { name: '胜率' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
    expect(table().queryByRole('columnheader', { name: /登场率/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '清除筛选' })).not.toBeInTheDocument();
  });

  it('preserves historical labels and links to canonical IDs', () => {
    for (const [name, id] of [
      ['表演者▪杰瑞', '表演者•杰瑞'],
      ['海盗杰瑞', '航海士杰瑞'],
      ['大表哥', '蒙金奇'],
      ['蓝猫', '汤姆'],
    ] as const) {
      expect(table().getByRole('link', { name })).toHaveAttribute(
        'href',
        `/characters/${encodeURIComponent(id)}`
      );
    }
  });

  it('keeps missing ban rates last in both directions and preserves genuine zeroes', () => {
    clickOption('至尊传奇');
    clickOption('鼠');
    fireEvent.click(table().getByRole('button', { name: '禁用率' }));
    expect(characterNames()).toEqual(['海盗杰瑞', '大表哥', '表演者▪杰瑞']);
    fireEvent.click(table().getByRole('button', { name: '禁用率' }));
    expect(characterNames()).toEqual(['大表哥', '海盗杰瑞', '表演者▪杰瑞']);
    expect(table().getByRole('cell', { name: '0.00%' })).toBeInTheDocument();
    expect(table().getByRole('cell', { name: '—' })).toBeInTheDocument();
  });

  it('colors pick and ban percentages while leaving missing values neutral', () => {
    const row = within(table().getByRole('link', { name: '大表哥' }).closest('tr')!);
    expect(row.getByText('1.00%').getAttribute('style')).toContain('--wiki-pick-rate-');
    expect(row.getByText('0.00%').getAttribute('style')).toContain('--wiki-ban-rate-');
    const missingRow = within(table().getByRole('link', { name: '表演者▪杰瑞' }).closest('tr')!);
    expect(missingRow.getByText('—')).not.toHaveAttribute('style');
  });

  it('hides unavailable ban rates and uses win-rate sorting until coverage returns', () => {
    fireEvent.click(table().getByRole('button', { name: '禁用率' }));
    clickOption('S24 (2025.4.30-5.25)');
    expect(table().queryByRole('columnheader', { name: /禁用率/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '禁用率' })).not.toBeInTheDocument();
    expect(screen.getByText('本赛季未提供禁用率数据。')).toBeInTheDocument();
    expect(table().getByRole('columnheader', { name: '胜率' })).toHaveAttribute(
      'aria-sort',
      'descending'
    );
    clickOption('S28');
    expect(table().getByRole('columnheader', { name: '禁用率' })).toHaveAttribute(
      'aria-sort',
      'descending'
    );
    clickOption('禁用率');
    clickOption('S24 (2025.4.30-5.25)');
    clickOption('S28');
    expect(table().queryByRole('columnheader', { name: /禁用率/ })).not.toBeInTheDocument();
  });

  it('exposes focusable sort buttons and updates the announced direction while retaining focus', () => {
    clickOption('至尊传奇');
    clickOption('鼠');
    const winHeader = table().getByRole('columnheader', { name: '胜率' });
    const pickHeader = table().getByRole('columnheader', { name: '登场率' });
    const winButton = within(winHeader).getByRole('button', { name: '胜率' });
    expect(winHeader).toHaveAttribute('aria-sort', 'descending');
    expect(pickHeader).not.toHaveAttribute('aria-sort');
    expect(winButton).toHaveProperty('tabIndex', 0);
    winButton.focus();
    fireEvent.click(winButton);
    expect(winButton).toHaveFocus();
    expect(winHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(characterNames()).toEqual(['海盗杰瑞', '大表哥', '表演者▪杰瑞']);

    fireEvent.click(within(pickHeader).getByRole('button', { name: '登场率' }));
    expect(pickHeader).toHaveAttribute('aria-sort', 'descending');
    expect(winHeader).not.toHaveAttribute('aria-sort');
    expect(characterNames()).toEqual(['表演者▪杰瑞', '海盗杰瑞', '大表哥']);
  });

  it('labels both tables and preserves the summary columns and missing percentages', () => {
    const summary = within(screen.getByRole('table', { name: '赛季总览' }));
    expect(summary.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      '段位',
      '组队类型',
      '猫胜率',
      '鼠胜率',
      '占比',
    ]);
    expect(summary.getByRole('cell', { name: '20.00%' })).toBeInTheDocument();
    expect(summary.getByRole('cell', { name: '-' })).toBeInTheDocument();
    expect(summary.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shortens only the end year in season labels and selects the original season', () => {
    clickOption('S24 (2025.4.30-5.25)');
    expect(characterNames()).toEqual(['海盗杰瑞', '蓝猫']);
    expect(
      screen.queryByRole('button', { name: 'S24 (2025.4.30-2025.5.25)' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'S28' })).toBeInTheDocument();
  });

  it('labels emperor rows by faction while preserving the combined rank filter and summary', () => {
    clickOption('S23');
    clickOption('无敌猫鼠皇');
    expect(table().getByRole('cell', { name: '无敌猫皇' })).toBeInTheDocument();
    expect(table().getByRole('cell', { name: '无敌鼠皇' })).toBeInTheDocument();
    const summary = within(screen.getByRole('table', { name: '赛季总览' }));
    expect(summary.getByRole('cell', { name: '无敌猫鼠皇' })).toBeInTheDocument();
  });

  it('leaves filters unchanged when rank and faction cells are double-clicked', () => {
    clickOption('S23');
    clickOption('无敌猫鼠皇');
    fireEvent.doubleClick(table().getByRole('cell', { name: '无敌猫皇' }));
    fireEvent.doubleClick(table().getByRole('cell', { name: '猫' }));
    expect(screen.getByRole('button', { name: '无敌猫鼠皇' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '猫' })).toHaveAttribute('aria-pressed', 'false');
    expect(characterNames()).toEqual(['杰瑞', '蓝猫']);
  });

  it('preserves character link identity when sorting rows', () => {
    clickOption('至尊传奇');
    clickOption('鼠');
    const characterLink = table().getByRole('link', { name: '表演者▪杰瑞' });
    fireEvent.click(table().getByRole('button', { name: '胜率' }));
    expect(characterNames()).toEqual(['海盗杰瑞', '大表哥', '表演者▪杰瑞']);
    expect(table().getByRole('link', { name: '表演者▪杰瑞' })).toBe(characterLink);
  });

  it('exports each table with its own displayed columns and missing values as empty cells', async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createUrl = jest.fn((_blob: Blob) => 'blob:export');
    URL.createObjectURL = createUrl;
    URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const exportCsv = async (title = '角色数据') => {
      fireEvent.click(screen.getByRole('button', { name: `导出${title}为 CSV` }));
      const blob = createUrl.mock.lastCall![0];
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
      });
    };

    try {
      clickOption('至尊传奇');
      clickOption('鼠');
      expect(await exportCsv('赛季总览')).toBe(
        '段位,组队类型,猫胜率,鼠胜率,占比\n至尊传奇,总体,55.00%,45.00%,20.00%\n机智黄金,总体,60.00%,40.00%,'
      );
      const csv = await exportCsv();
      expect(csv).toContain('角色,登场率,胜率,禁用率');
      expect(csv).toContain('表演者▪杰瑞,3.00%,70.00%,\n');
      expect(csv).toContain('大表哥,1.00%,60.00%,0.00%');
      clickOption('S24 (2025.4.30-5.25)');
      expect(screen.queryByRole('button', { name: '导出赛季总览为 CSV' })).not.toBeInTheDocument();
      expect(await exportCsv()).toBe(
        'No.,段位,阵营,角色,登场率,胜率\n1,至尊传奇,鼠,海盗杰瑞,3.00%,40.00%'
      );
      clickOption('S28');
      clickOption('清除筛选');
      clickOption('全段位');
      expect(characterNames()).toEqual(['杰瑞']);
      expect(table().getByRole('cell', { name: '全段位' })).toBeInTheDocument();
      expect(await exportCsv()).toBe(
        'No.,段位,阵营,角色,登场率,胜率,禁用率\n1,全段位,鼠,杰瑞,3.00%,50.00%,'
      );
      clickOption('S23');
      expect(await exportCsv('赛季总览')).toBe(
        '段位,组队类型,猫胜率,鼠胜率\n无敌猫鼠皇,总体,55.00%,45.00%'
      );
      const emperorCsv = await exportCsv();
      expect(emperorCsv).toContain('1,无敌鼠皇,鼠,杰瑞');
      expect(emperorCsv).toContain('1,无敌猫皇,猫,蓝猫');
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
